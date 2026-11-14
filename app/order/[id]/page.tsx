import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrder, publicOrder, reconcile, tokenMatches } from "@/lib/orders";
import { pouchMock } from "@/lib/pouch";
import { OrderView } from "./view";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const { id } = await props.params;
  const { t } = await props.searchParams;
  const token = typeof t === "string" ? t : null;
  const order = await getOrder(id);
  if (!order || !tokenMatches(order, token)) notFound();
  const fresh = await reconcile(order);
  return <OrderView initial={publicOrder(fresh)} token={token!} testMode={pouchMock} />;
}
