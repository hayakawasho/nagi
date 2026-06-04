import type { ComponentContext, ComponentSetup, ExposedSetup, RefElement } from "../../types";
declare enum LifecycleHooks {
    MOUNTED = "mount",
    UNMOUNTED = "unmount",
    DEFERRED_UNMOUNT = "deferredUnmount"
}
declare class ComponentContextImpl<T = any> implements ComponentContext<ExposedSetup<T>> {
    #private;
    private [LifecycleHooks.MOUNTED];
    private [LifecycleHooks.UNMOUNTED];
    private [LifecycleHooks.DEFERRED_UNMOUNT];
    parent: ComponentContextImpl | null;
    readonly uid: string;
    readonly name: ComponentContext["name"];
    current: ExposedSetup<T>;
    props: Parameters<ComponentSetup<T>["setup"]>[1];
    element: ComponentContext["element"];
    provides: Map<symbol, unknown>;
    constructor(element: RefElement, name: string);
    onMount: () => void;
    onDeferredUnmount: () => Promise<void>;
    onUnmount: () => void;
    addChild: (child: ComponentContextImpl) => void;
    removeChild: (child: ComponentContextImpl) => Promise<void>;
    get childElements(): RefElement[];
}
export {};
