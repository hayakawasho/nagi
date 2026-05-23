import type { ComponentContext, ComponentSetup, ExposedSetup, RefElement } from "../../types";
export declare function useSlot(): {
    addChild<Child extends ComponentSetup>(targetOrTargets: RefElement | RefElement[], child: Child, props?: Partial<Parameters<Child["setup"]>[1]>): ComponentContext<ExposedSetup<ReturnType<Child["setup"]>>>[];
    removeChild(children: ComponentContext[]): void;
};
