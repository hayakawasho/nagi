export type RefElement = HTMLElement | SVGElement;
export type ComponentProps<Props> = Readonly<Props>;
export type ComponentSetup<SetupResult = void | Record<string, unknown>, Props = Record<string, unknown>> = {
    name: string;
    setup(el: RefElement, props: ComponentProps<Props>): SetupResult;
};
/** @deprecated Use `ComponentSetup` instead. */
export type IComponent<SetupResult = void | Record<string, unknown>, Props = Record<string, unknown>> = ComponentSetup<SetupResult, Props>;
export type Cleanup = () => void;
export type LifecycleHandler = () => void | Cleanup;
export type SchedulePriority = "user-blocking" | "user-visible" | "background";
export type Scheduler = {
    schedule(task: () => void, options?: {
        priority?: SchedulePriority;
        signal?: AbortSignal;
    }): void;
};
//# sourceMappingURL=types.d.ts.map