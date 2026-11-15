import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getOrder, publicOrder, reconcile, tokenMatches } from "@/lib/orders";
import { pouchMock } from "@/lib/pouch";
import { OrderView } from "@/components/order-view";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ArkPlayOrderPage(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await props.params;
  const { t } = await props.searchParams;
  const token = typeof t === "string" ? t : null;
  const order = await getOrder(id);
  if (!order || !tokenMatches(order, token)) notFound();
  // Interlink orders live on the Interlink store.
  if (order.store !== "arkplay") redirect(`/order/${id}?t=${encodeURIComponent(token!)}`);
  const fresh = await reconcile(order);
  return <OrderView initial={publicOrder(fresh)} token={token!} testMode={pouchMock} />;
}
