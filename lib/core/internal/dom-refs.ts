import type { RefElement } from "../../types";

export function domRefs(ref: Set<string>, scope: RefElement) {
  const findRef = (q: string) => {
    const currentScope = scope ?? document;
    const nodes = Array.from(
      currentScope.querySelectorAll(`[data-ref="${q}"]`),
    );
    const { length } = nodes;

    return length === 0
      ? null
      : ({
          1: nodes[0],
        }[length] ?? nodes);
  };

  // biome-ignore lint/suspicious/noExplicitAny: dynamic key accumulation
  const childRef = [...ref].reduce<any>((acc, cur) => {
    acc[cur] = findRef(cur);
    return acc;
  }, {});

  return childRef;
}
