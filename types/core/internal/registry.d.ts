import type { RefElement } from "../../types";
import type { ComponentContext } from "../component";
export declare const DOM_COMPONENT_INSTANCE: WeakMap<RefElement, ComponentContext<any>>;
export declare function bindDOMNodeToComponent(el: RefElement, component: ComponentContext): void;
