import { useMount } from "../core/lifecycle";
import { readonly, signal } from "../core/reactivity";

import type { Cleanup } from "../types";

export function useMediaQuery(
  query: string,
  callbackWhenMatches: () => Cleanup,
) {
  const mql = window.matchMedia(query);
  const matchesQuery = signal(mql.matches);

  let cleanup: Cleanup | null = null;

  function onChange(evt: MediaQueryListEvent) {
    matchesQuery.value = evt.matches;
    if (evt.matches) {
      cleanup = callbackWhenMatches();
    } else {
      cleanup?.();
      cleanup = null;
    }
  }

  useMount(() => {
    mql.addEventListener("change", onChange);

    if (mql.matches) {
      cleanup = callbackWhenMatches();
    }

    return () => {
      cleanup?.();
      mql.removeEventListener("change", onChange);
    };
  });

  return {
    matchesQuery: readonly(matchesQuery),
  } as const;
}
