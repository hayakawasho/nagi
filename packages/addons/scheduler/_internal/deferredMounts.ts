import type { RefElement } from "@usenagi/core";

type DeferredMount = {
  readonly signal: AbortSignal;
  complete(): boolean;
  abort(): void;
};

class DeferredMounts {
  #pending = new Map<RefElement, AbortController>();

  add(el: RefElement): DeferredMount {
    // Discard the previous registration of the same element and apply the latest one (last-write-wins).
    this.#cancel(el, this.#pending.get(el));

    const controller = new AbortController();
    this.#pending.set(el, controller);

    return {
      signal: controller.signal,
      complete: () => this.#commit(el, controller),
      abort: () => this.#cancel(el, controller),
    };
  }

  abort = (el: RefElement): void => {
    this.#cancel(el, this.#pending.get(el));
  };

  #commit(el: RefElement, controller: AbortController): boolean {
    const isUnregistered = this.#pending.get(el) !== controller;
    const isAborted = controller.signal.aborted;
    const isSettled = isUnregistered || isAborted;

    if (isSettled) {
      return false;
    }

    this.#pending.delete(el);
    return true;
  }

  #cancel(el: RefElement, controller?: AbortController): void {
    const isSettled = !controller || this.#pending.get(el) !== controller;

    if (isSettled) {
      return;
    }

    controller.abort();
    this.#pending.delete(el);
  }
}

function createDeferredMounts(): DeferredMounts {
  return new DeferredMounts();
}

/** @internal */
export { createDeferredMounts };
