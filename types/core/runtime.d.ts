import { ComponentContext } from "./component";
import type { ComponentSetup, RefElement } from "../types";
export declare function getCurrentComponent(hookName: string): ComponentContext;
export declare function createComponent(wrap: ComponentSetup, root: RefElement, props?: Record<string, any>): ComponentContext<any>;
