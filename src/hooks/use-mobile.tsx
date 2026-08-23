import * as React from "react";

const MOBILE_BREAKPOINT = 1024;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => globalThis.matchMedia(QUERY).matches,
    () => false,
  );
}

// eslint-disable-next-line promise/prefer-await-to-callbacks -- useSyncExternalStore requires a subscribe callback
function subscribe(callback: () => void) {
  const mql = globalThis.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => {
    mql.removeEventListener("change", callback);
  };
}
