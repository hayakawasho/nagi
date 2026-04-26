import type { IComponent } from "../types";
export type ContextProvider<T> = {
    readonly _id: symbol;
    readonly _factory: () => T;
};
export declare function createContext<T>(): [
    (factory: () => T) => ContextProvider<T>,
    () => T
];
export declare function withContext<SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(component: IComponent<SetupResult, Props>, provider: ContextProvider<unknown>): IComponent<SetupResult, Props>;
//# sourceMappingURL=createContext.d.ts.map