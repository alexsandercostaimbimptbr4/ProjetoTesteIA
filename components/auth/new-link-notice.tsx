import Link from "next/link";

// An error about the reset link, with the way out: asking for another one.
export function NewLinkNotice({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p role="alert" className={className}>
      {message}.{" "}
      <Link href="/recuperar-senha" className="underline">
        Pedir um novo link
      </Link>
    </p>
  );
}
