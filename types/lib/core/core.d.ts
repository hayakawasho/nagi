import type { RefElement, IComponent, ComponentContext } from "../types";
export declare function create(): {
    component(wrap: IComponent): (el: RefElement, props?: Record<string, any>) => ComponentContext<any>;
    unmount(targets: RefElement[]): void;
};
export declare function defineComponent<Context extends Record<string, unknown>>(): <SetupResult extends Record<string, unknown> | void>(opts: {
    name: string;
    setup(el: RefElement, context: Context): SetupResult;
}) => (context: Context) => IComponent<SetupResult>;
export declare function defineComponent<SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(opts: IComponent<SetupResult, Props>): IComponent<SetupResult, Props>;
//# sourceMappingURL=core.d.ts.map