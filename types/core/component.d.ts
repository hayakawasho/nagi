import type { ComponentProps, ComponentSetup, RefElement } from "../types";
export declare enum LifecycleHooks {
    MOUNTED = "Mounted",
    UNMOUNTED = "Unmounted"
}
export declare class ComponentContext<T = any> {
    #private;
    private [LifecycleHooks.MOUNTED];
    private [LifecycleHooks.UNMOUNTED];
    parent: ComponentContext<T> | null;
    readonly uid: string;
    readonly name: string;
    current: ReturnType<ComponentSetup<T>["setup"]>;
    props: Parameters<ComponentSetup<T>["setup"]>[1];
    element: RefElement;
    provides: Map<symbol, unknown>;
    constructor(element: RefElement, name: string);
    onMount: () => void;
    onUnmount: () => void;
    addChild: (child: ComponentContext) => void;
    removeChild: (child: ComponentContext) => void;
    get childElements(): RefElement[];
}
export declare function defineComponent<SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(opts: {
    name: string;
    props: Props;
    setup(el: RefElement, props: ComponentProps<Props>): SetupResult;
}): ComponentSetup<SetupResult, Props>;
export declare function defineComponent<SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(opts: {
    name: string;
    setup(el: RefElement, props: ComponentProps<Props>): SetupResult;
}): ComponentSetup<SetupResult, Props>;
export declare function defineComponent<SetupResult extends Record<string, unknown> | void>(opts: {
    name: string;
    setup(el: RefElement): SetupResult;
}): ComponentSetup<SetupResult, Record<string, never>>;
export declare function defineComponent(opts: ComponentSetup): ComponentSetup;
