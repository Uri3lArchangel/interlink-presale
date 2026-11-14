import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page">
      <div className="wrap">
        <h1 className="h1 page-h">
          Page not found
        </h1>
        <p className="lede" style={{ marginTop: 24 }}>
          The page doesn’t exist, or the order link is incomplete. Order links are in your confirmation email.
        </p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 32 }}>
          Back to the store
        </Link>
      </div>
    </section>
  );
}
