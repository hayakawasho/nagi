import { useMount } from "../core/lifecycle";

type ElementEventListener<
  K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
> = (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown;

export function useEvent<
  T extends HTMLElement = HTMLElement,
  K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
>(
  target: T,
  eventType: K,
  listener: ElementEventListener<K>,
  optionsOrUseCapture?: boolean | AddEventListenerOptions,
) {
  useMount(() => {
    target.addEventListener(eventType, listener, optionsOrUseCapture);

    return () => {
      target.removeEventListener(eventType, listener, optionsOrUseCapture);
    };
  });
}
