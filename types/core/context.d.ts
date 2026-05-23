import type { ComponentSetup } from "../types";
export type Provider<T> = {
    readonly _id: symbol;
    readonly _type?: T;
};
export declare function createContext<T>(): [Provider<T>, () => Readonly<T>];
export declare function withContext<T>(key: Provider<T>, value: T): <SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(component: ComponentSetup<SetupResult, Props>) => ComponentSetup<SetupResult, Props>;
