import { LifecycleHooks } from '../lifecycle';
import type { RefElement, IComponent } from '../../types';
export declare function getCurrentComponent(hookName: string): ComponentContext<any>;
declare class ComponentContext<T = any> {
    #private;
    private [LifecycleHooks.MOUNTED];
    private [LifecycleHooks.UNMOUNTED];
    parent: ComponentContext<T> | null;
    readonly uid: string;
    current: ReturnType<IComponent<T>["setup"]>;
    props: Parameters<IComponent<T>["setup"]>[1];
    element: RefElement;
    provides: Map<symbol, unknown>;
    constructor(element: RefElement, name: string);
    onMount: () => void;
    onUnmount: () => void;
    addChild: (child: ComponentContext) => void;
    removeChild: (child: ComponentContext) => void;
}
export declare function createComponent(wrap: IComponent): (root: RefElement, props: Record<string, any>) => ComponentContext<any>;
export type { ComponentContext };
//# sourceMappingURL=component.d.ts.map