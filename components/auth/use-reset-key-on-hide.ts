import { useLayoutEffect, useState } from "react";

// Returns a key that changes every time the route is hidden. Next keeps a
// route mounted but hidden after the user leaves it, and React runs
// layout-effect cleanups at that moment. A form rendered with this key is
// rebuilt from scratch when the user comes back, which also discards the
// last answer from the server (useActionState has no reset of its own).
export function useResetKeyOnHide() {
  const [resetKey, setResetKey] = useState(0);
  useLayoutEffect(() => () => setResetKey((key) => key + 1), []);
  return resetKey;
}
