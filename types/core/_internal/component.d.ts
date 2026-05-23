import type { ComponentContext, ComponentSetup, ExposedSetup, RefElement } from "../../types";
declare enum LifecycleHooks {
    MOUNTED = "Mounted",
    UNMOUNTED = "Unmounted"
}
declare class ComponentContextImpl<T = any> implements ComponentContext<ExposedSetup<T>> {
    #private;
    private [LifecycleHooks.MOUNTED];
    private [LifecycleHooks.UNMOUNTED];
    parent: ComponentContextImpl | null;
    readonly uid: string;
    readonly name: ComponentContext["name"];
    current: ExposedSetup<T>;
    props: Parameters<ComponentSetup<T>["setup"]>[1];
    element: ComponentContext["element"];
    provides: Map<symbol, unknown>;
    constructor(element: RefElement, name: string);
    onMount: () => void;
    onUnmount: () => void;
    addChild: (child: ComponentContextImpl) => void;
    removeChild: (child: ComponentContextImpl) => void;
    get childElements(): RefElement[];
}
export {};
