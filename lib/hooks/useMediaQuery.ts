import { useMount } from "../core/lifecycle";
import { readonly, ref } from "../core/reactivity";

import type { Cleanup } from "../types";

export function useMediaQuery(
  query: string,
  callbackWhenMatches: () => Cleanup,
) {
  const mediaQueryList = window.matchMedia(query);
  const matchesQuery = ref(mediaQueryList.matches);

  let cleanup: Cleanup | null = null;

  function onChangeMediaQueryList(evt: MediaQueryListEvent) {
    matchesQuery.value = evt.matches;
    if (evt.matches) {
      cleanup = callbackWhenMatches();
    } else {
      cleanup?.();
      cleanup = null;
    }
  }

  useMount(() => {
    mediaQueryList.addEventListener("change", onChangeMediaQueryList);

    if (mediaQueryList.matches) {
      cleanup = callbackWhenMatches();
    }

    return () => {
      cleanup?.();
      mediaQueryList.removeEventListener("change", onChangeMediaQueryList);
    };
  });

  return {
    matchesQuery: readonly(matchesQuery),
  } as const;
}
