import { ComponentContextImpl } from "./_internal/component";
import type { ComponentSetup, RefElement } from "../types";
declare function getCurrentComponent(hookName: string): ComponentContextImpl;
declare function createComponent<S extends ComponentSetup>(wrap: S, root: RefElement, props?: Record<string, any>): ComponentContextImpl<ReturnType<S["setup"]>>;
export {};
