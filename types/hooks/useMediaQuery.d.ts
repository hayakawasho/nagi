import type { Cleanup } from "../types";
export declare function useMediaQuery(query: string, callbackWhenMatches: () => Cleanup): {
    readonly matchesQuery: import("../main").ReadonlyRef<boolean>;
};
