import type { IComponent, RefElement, ComponentContext } from "../types";
export declare function useSlot(): {
    addChild<Child extends IComponent>(targetOrTargets: RefElement | RefElement[], child: Child, props?: Parameters<Child["setup"]>[1]): ComponentContext<ReturnType<Child["setup"]>>[];
    removeChild(children: ComponentContext[]): void;
};
//# sourceMappingURL=useSlot.d.ts.map