type ElementEventListener<K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap> = (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown;
export declare function useEvent<T extends HTMLElement = HTMLElement, K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap>(target: T, eventType: K, listener: ElementEventListener<K>, optionsOrUseCapture?: boolean | AddEventListenerOptions): void;
export {};
//# sourceMappingURL=useEvent.d.ts.map