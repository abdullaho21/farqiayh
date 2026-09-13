import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>That page isn’t here.</h1>
      <p>The poll may have moved or been removed.</p>
      <Link className="button button-primary" href="/">
        Back to polls
      </Link>
    </div>
  );
}
