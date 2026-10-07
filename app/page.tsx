import { redirect } from "next/navigation";

// The proxy already redirects "/" by session. This is the fallback if it did
// not run: /dashboard checks the session itself.
export default function Home() {
  redirect("/dashboard");
}
