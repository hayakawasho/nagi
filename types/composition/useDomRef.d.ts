import type { RefElement } from "../types";
export declare function useDomRef<T extends Record<string, RefElement | RefElement[] | null>>(...refKey: (keyof T & string)[]): {
    refs: T;
};
//# sourceMappingURL=useDomRef.d.ts.map