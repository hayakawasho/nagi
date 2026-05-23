import type { RefElement } from "../../types";
import type { ComponentContextImpl } from "./component";
declare const DOM_COMPONENT_INSTANCE: WeakMap<RefElement, ComponentContextImpl<any>>;
declare function bindDOMNodeToComponent(el: RefElement, component: ComponentContextImpl): void;
export {};
