import { createClient } from "@supabase/supabase-js";

// A Supabase client with no session and no cookies, for requests made on
// behalf of nobody in particular. The cookie-backed client would not do for
// asking a reset e-mail: it stores a PKCE verifier in cookies when Supabase
// accepts the request and removes it when Supabase refuses, so the response
// would tell an existing account from an unknown one.
export function createStatelessClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
