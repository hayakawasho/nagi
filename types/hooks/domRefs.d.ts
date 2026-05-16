import type { RefElement } from "../types";
export declare function domRefs<T extends Record<string, RefElement | RefElement[] | null>>(scope: RefElement, getBoundaries: () => RefElement[]): T;
