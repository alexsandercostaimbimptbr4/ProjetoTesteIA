import { Suspense } from "react";
import { NewLinkNotice } from "@/components/auth/new-link-notice";
import { ResetForm } from "@/components/auth/reset-form";
import { AUTH_MESSAGES } from "@/lib/auth/errors";

export const metadata = {
  title: "Nova senha",
  // The address carries the single-use link: it must not reach other sites.
  referrer: "no-referrer" as const,
};

export default function ResetPasswordPage(
  props: PageProps<"/redefinir-senha">,
) {
  return (
    <div className="grid gap-6">
      <h1 className="text-center text-sm text-muted-foreground">
        Crie uma nova senha
      </h1>
      {/* The link is in the address, which is only known at request time. */}
      <Suspense fallback={null}>
        <ResetFromLink searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function ResetFromLink({
  searchParams,
}: Pick<PageProps<"/redefinir-senha">, "searchParams">) {
  const { token_hash: tokenHash } = await searchParams;

  // Opened without a link, e.g. typed by hand. A link that is present is
  // only checked when the form is sent.
  if (typeof tokenHash !== "string" || tokenHash === "") {
    return (
      <NewLinkNotice
        message={AUTH_MESSAGES.linkExpired}
        className="text-center text-sm text-destructive"
      />
    );
  }
  return <ResetForm tokenHash={tokenHash} />;
}
