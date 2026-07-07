import { ComponentContextImpl } from "./_internal/component";
import type { ComponentSetup, RefElement } from "../types";
import type { DebugReporter } from "./debugEvent";
declare function getCurrentComponent(hookName: string): ComponentContextImpl;
declare function createComponent<S extends ComponentSetup>(wrap: S, root: RefElement, props?: Record<string, any>, reporters?: readonly DebugReporter[]): ComponentContextImpl<ReturnType<S["setup"]>>;
export {};
