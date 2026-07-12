type ElementEventListener<K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap> = (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown;
type WindowEventListener<K extends keyof WindowEventMap = keyof WindowEventMap> = (this: Window, ev: WindowEventMap[K]) => unknown;
type DocumentEventListener<K extends keyof DocumentEventMap = keyof DocumentEventMap> = (this: Document, ev: DocumentEventMap[K]) => unknown;
export declare function useEvent<K extends keyof WindowEventMap = keyof WindowEventMap>(target: Window, eventType: K, listener: WindowEventListener<K>, optionsOrUseCapture?: boolean | AddEventListenerOptions): void;
export declare function useEvent<K extends keyof DocumentEventMap = keyof DocumentEventMap>(target: Document, eventType: K, listener: DocumentEventListener<K>, optionsOrUseCapture?: boolean | AddEventListenerOptions): void;
export declare function useEvent<T extends HTMLElement = HTMLElement, K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap>(target: T, eventType: K, listener: ElementEventListener<K>, optionsOrUseCapture?: boolean | AddEventListenerOptions): void;
export declare function useEvent(target: EventTarget, eventType: string, listener: (ev: Event) => unknown, optionsOrUseCapture?: boolean | AddEventListenerOptions): void;
export {};
