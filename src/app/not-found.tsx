import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main" className="container not-found">
      <span className="eyebrow" style={{ justifyContent: "center" }}>
        404 / OFF THE BEATEN PATH
      </span>
      <h1>Nothing to guard here.</h1>
      <p>
        This page seems to have wandered off.
        <br />
        Your guardian can get you back home.
      </p>
      <Link href="/" className="button button-primary">
        <ArrowLeft size={15} /> Back to safety
      </Link>
    </main>
  );
}
