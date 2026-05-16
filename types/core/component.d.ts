import type { ComponentSetup, RefElement } from "../types";
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
    /** @internal useSlot から呼び出される内部 API。外部利用は非推奨。 */
    addChild: (child: ComponentContext) => void;
    /** @internal useSlot から呼び出される内部 API。外部利用は非推奨。 */
    removeChild: (child: ComponentContext) => void;
    get childElements(): RefElement[];
}
export declare function defineComponent<Context extends Record<string, unknown>>(): <SetupResult extends Record<string, unknown> | void>(opts: {
    name: string;
    setup(el: RefElement, context: Context): SetupResult;
}) => (context: Context) => ComponentSetup<SetupResult>;
export declare function defineComponent<SetupResult extends Record<string, unknown> | void, Props extends Record<string, unknown>>(opts: ComponentSetup<SetupResult, Props>): ComponentSetup<SetupResult, Props>;
