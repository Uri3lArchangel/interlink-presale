import { NextResponse, type NextRequest } from "next/server";
import { listChains, listTokens } from "@/lib/crypto-catalog";

export const runtime = "nodejs";

/**
 * Crypto payment options for the order page.
 * GET /api/crypto/options             -> { chains: [...] } every network Dextopus supports
 * GET /api/crypto/options?chainId=56  -> { tokens: [...] } every token accepted on that network
 */
export async function GET(req: NextRequest) {
  const chainId = req.nextUrl.searchParams.get("chainId");
  const headers = { "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600" };
  try {
    if (chainId) {
      const tokens = await listTokens(Number(chainId));
      return NextResponse.json(
        { tokens: tokens.map(({ key, symbol, name, address, decimals, logoUrl, vm, network, chainId }) => ({ key, symbol, name, address, decimals, logoUrl, vm, network, chainId })) },
        { headers },
      );
    }
    return NextResponse.json({ chains: await listChains() }, { headers });
  } catch (err) {
    console.error("[crypto] options failed", err);
    return NextResponse.json({ error: "Crypto options are unavailable right now. Try again shortly, or pay by bank transfer." }, { status: 502 });
  }
}
