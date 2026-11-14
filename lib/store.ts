import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

/**
 * A tiny key-value store. Production uses Upstash Redis (set UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN, or connect the Upstash integration on Vercel, which sets KV_REST_API_*).
 * Local development falls back to a JSON file in .data/, which is not safe for
 * serverless hosting, so production refuses to start without Redis.
 */
interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  /** Set only when the key is absent. Returns true if this call set it. */
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
}

function redisStore(): KV | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return {
    get: (key) => redis.get(key),
    set: async (key, value) => {
      await redis.set(key, value);
    },
    setNX: async (key, value, ttl) => (await redis.set(key, value, { nx: true, ex: ttl })) === "OK",
    del: async (key) => {
      await redis.del(key);
    },
  };
}

function fileStore(): KV {
  const file = path.join(process.cwd(), ".data", "store.json");
  type Entry = { v: unknown; exp?: number };
  let queue = Promise.resolve();
  const read = async (): Promise<Record<string, Entry>> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (data: Record<string, Entry>) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  };
  // Serialise every mutation so concurrent requests in the dev server don't clobber each other.
  const mutate = <T>(fn: (d: Record<string, Entry>) => T) => {
    const run = queue.then(async () => {
      const data = await read();
      const result = fn(data);
      await write(data);
      return result;
    });
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
  const live = (e?: Entry) => (e && (!e.exp || e.exp > Date.now()) ? e : undefined);
  return {
    get: async <T>(key: string) => {
      await queue;
      return (live((await read())[key])?.v as T) ?? null;
    },
    set: (key, value) =>
      mutate((d) => {
        d[key] = { v: structuredClone(value) };
      }),
    setNX: (key, value, ttl) =>
      mutate((d) => {
        if (live(d[key])) return false;
        d[key] = { v: value, exp: Date.now() + ttl * 1000 };
        return true;
      }),
    del: (key) =>
      mutate((d) => {
        delete d[key];
      }),
  };
}

let instance: KV | undefined;
export function kv(): KV {
  if (instance) return instance;
  const redis = redisStore();
  if (!redis && process.env.NODE_ENV === "production" && !process.env.ALLOW_FILE_STORE) {
    throw new Error("Order storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
  }
  instance = redis ?? fileStore();
  return instance;
}

/** Run fn while holding a short lock on `name`, so a webhook and a status poll can't both settle the same order. */
export async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
  const key = `lock:${name}`;
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await kv().setNX(key, "1", 30)) {
      try {
        return await fn();
      } finally {
        await kv().del(key);
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
