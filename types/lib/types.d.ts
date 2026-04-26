export type RefElement = HTMLElement | SVGElement;
export type ComponentProps<Props> = Readonly<Props>;
export interface IComponent<SetupResult = void | Record<string, unknown>, Props = Record<string, unknown>> {
    name: string;
    setup(el: RefElement, props: ComponentProps<Props>): SetupResult;
}
export type { ComponentContext } from "./core/internal/component";
export type Cleanup = () => void;
export type LifecycleHandler = () => void | (() => void);
//# sourceMappingURL=types.d.ts.map