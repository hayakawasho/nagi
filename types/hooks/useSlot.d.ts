import type { ComponentContext } from "../core/component";
import type { ComponentSetup, RefElement } from "../types";
export declare function useSlot(): {
    addChild<Child extends ComponentSetup>(targetOrTargets: RefElement | RefElement[], child: Child, props?: Parameters<Child["setup"]>[1]): ComponentContext<ReturnType<Child["setup"]>>[];
    removeChild(children: ComponentContext[]): void;
};
