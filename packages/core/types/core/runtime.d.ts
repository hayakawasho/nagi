import { ComponentContextImpl } from "./_internal/component";
import type { ComponentSetup, RefElement } from "../types";
import type { DebugReporter } from "./debugEvent";
type AddonPipeline = {
    composeComponent: <S extends ComponentSetup>(setup: S) => S;
    composeUnmount: (fn: (targets: RefElement[]) => Promise<void>) => (targets: RefElement[]) => Promise<void>;
};
declare function getCurrentAddonPipeline(): AddonPipeline | undefined;
declare function withAddonPipeline<T>(pipeline: AddonPipeline | undefined, fn: () => T): T;
declare function getCurrentComponent(hookName: string): ComponentContextImpl;
declare function createComponent<S extends ComponentSetup>(wrap: S, root: RefElement, props?: Record<string, any>, reporters?: readonly DebugReporter[]): ComponentContextImpl<ReturnType<S["setup"]>>;
export type { AddonPipeline };
