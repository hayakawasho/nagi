import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create } from "../../core/app";
import { createScheduler } from "../scheduler/index";

import { idle, interaction, media, visible } from "./index";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ──────────────────────────────────────────────────────────────────────────
// visible
// ──────────────────────────────────────────────────────────────────────────

describe("visible()", () => {
  it("isIntersecting=true で resolve、disconnect される", async () => {
    const el = makeEl();
    const observed: HTMLElement[] = [];
    const disconnect = vi.fn();
    let trigger!: (entries: Partial<IntersectionObserverEntry>[]) => void;

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          cb: (entries: Partial<IntersectionObserverEntry>[]) => void,
        ) {
          trigger = cb;
        }
        observe(el: HTMLElement) {
          observed.push(el);
        }
        disconnect = disconnect;
      },
    );

    const ac = new AbortController();
    const promise = visible()(el, ac.signal);

    expect(observed).toEqual([el]);

    trigger([{ isIntersecting: true }]);
    await expect(promise).resolves.toBeUndefined();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("isIntersecting=false なら resolve しない", async () => {
    const el = makeEl();
    let trigger!: (entries: Partial<IntersectionObserverEntry>[]) => void;

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          cb: (entries: Partial<IntersectionObserverEntry>[]) => void,
        ) {
          trigger = cb;
        }
        observe() {}
        disconnect() {}
      },
    );

    const ac = new AbortController();
    let resolved = false;
    visible()(el, ac.signal).then(() => {
      resolved = true;
    });

    trigger([{ isIntersecting: false }]);
    await Promise.resolve();
    expect(resolved).toBe(false);
  });

  it("signal abort で reject + disconnect", async () => {
    const el = makeEl();
    const disconnect = vi.fn();

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect = disconnect;
      },
    );

    const ac = new AbortController();
    const promise = visible()(el, ac.signal);

    ac.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("aborted な signal を渡すと即 reject", async () => {
    const el = makeEl();
    const ac = new AbortController();
    ac.abort();
    await expect(visible()(el, ac.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// idle
// ──────────────────────────────────────────────────────────────────────────

describe("idle()", () => {
  it("requestIdleCallback で resolve", async () => {
    const el = makeEl();
    let cb!: () => void;
    vi.stubGlobal("requestIdleCallback", (fn: () => void) => {
      cb = fn;
      return 1 as unknown as number;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    const ac = new AbortController();
    const promise = idle()(el, ac.signal);

    cb();
    await expect(promise).resolves.toBeUndefined();
  });

  it("rIC が無い環境では setTimeout にフォールバック", async () => {
    const el = makeEl();
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.stubGlobal("cancelIdleCallback", undefined);

    const ac = new AbortController();
    const promise = idle()(el, ac.signal);
    await expect(promise).resolves.toBeUndefined();
  });

  it("signal abort で cancelIdleCallback が呼ばれる", async () => {
    const el = makeEl();
    const cancel = vi.fn();
    vi.stubGlobal("requestIdleCallback", () => 42 as unknown as number);
    vi.stubGlobal("cancelIdleCallback", cancel);

    const ac = new AbortController();
    const promise = idle()(el, ac.signal);

    ac.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledWith(42);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// media
// ──────────────────────────────────────────────────────────────────────────

describe("media()", () => {
  function stubMedia(matches: boolean) {
    const listeners = new Set<() => void>();
    const mql = {
      matches,
      addEventListener(_e: string, fn: () => void) {
        listeners.add(fn);
      },
      removeEventListener(_e: string, fn: () => void) {
        listeners.delete(fn);
      },
      _setMatches(v: boolean) {
        mql.matches = v;
        for (const l of listeners) l();
      },
      _listenerCount() {
        return listeners.size;
      },
    };
    vi.stubGlobal("matchMedia", () => mql);
    return mql;
  }

  it("初期 matches=true なら即 resolve", async () => {
    const el = makeEl();
    stubMedia(true);
    const ac = new AbortController();
    await expect(
      media("(min-width: 1px)")(el, ac.signal),
    ).resolves.toBeUndefined();
  });

  it("change イベントで matches=true になったら resolve", async () => {
    const el = makeEl();
    const mql = stubMedia(false);
    const ac = new AbortController();

    const promise = media("(min-width: 1px)")(el, ac.signal);
    expect(mql._listenerCount()).toBe(1);

    mql._setMatches(true);
    await expect(promise).resolves.toBeUndefined();
    expect(mql._listenerCount()).toBe(0);
  });

  it("signal abort で reject + listener 解除", async () => {
    const el = makeEl();
    const mql = stubMedia(false);
    const ac = new AbortController();

    const promise = media("(min-width: 1px)")(el, ac.signal);
    ac.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(mql._listenerCount()).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// interaction
// ──────────────────────────────────────────────────────────────────────────

describe("interaction()", () => {
  it("初回 click で resolve", async () => {
    const el = makeEl();
    const ac = new AbortController();
    const promise = interaction(["click"])(el, ac.signal);
    el.click();
    await expect(promise).resolves.toBeUndefined();
  });

  it("複数イベント指定: 最初に発火した1つで resolve、他のリスナも解除", async () => {
    const el = makeEl();
    const ac = new AbortController();
    const promise = interaction(["click", "focus"])(el, ac.signal);

    const evt = new Event("focus");
    el.dispatchEvent(evt);
    await expect(promise).resolves.toBeUndefined();

    // resolve 後に click しても何も起こらない (listener 解除済み)
    let extraFired = false;
    el.addEventListener("click", () => {
      extraFired = true;
    });
    el.click();
    expect(extraFired).toBe(true); // 自分のリスナだけ動く、interaction の側は解除済み
  });

  it("signal abort で reject + リスナ解除", async () => {
    const el = makeEl();
    const ac = new AbortController();
    const promise = interaction(["click"])(el, ac.signal);

    ac.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });

    // abort 後に click しても resolve 副作用は無い (再 reject も無い)
    el.click();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// when + scheduler 統合
// ──────────────────────────────────────────────────────────────────────────

describe("when + scheduler 連携", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("when 発火後に scheduler 経由で setup が走る", async () => {
    const el = makeEl();
    const setupFn = vi.fn();

    let trigger!: () => void;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (e: Partial<IntersectionObserverEntry>[]) => void) {
          trigger = () => cb([{ isIntersecting: true }]);
        }
        observe() {}
        disconnect() {}
      },
    );

    const { component } = create({
      scheduler: createScheduler({ priority: "user-blocking" }),
    });

    component({ name: "lazy", setup: setupFn }, { when: visible() })(el);

    // when 発火前は setup 走らない
    await Promise.resolve();
    expect(setupFn).not.toHaveBeenCalled();

    // when 発火 → scheduler キュー → microtask 消化
    trigger();
    await Promise.resolve();
    await Promise.resolve();
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it("when 待機中の unmount で setup が走らない", async () => {
    const el = makeEl();
    const setupFn = vi.fn();

    let trigger!: () => void;
    let disconnected = false;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (e: Partial<IntersectionObserverEntry>[]) => void) {
          trigger = () => cb([{ isIntersecting: true }]);
        }
        observe() {}
        disconnect() {
          disconnected = true;
        }
      },
    );

    const { component, unmount } = create({
      scheduler: createScheduler({ priority: "user-blocking" }),
    });

    component({ name: "lazy", setup: setupFn }, { when: visible() })(el);

    unmount([el]);
    expect(disconnected).toBe(true);

    // 念のため発火させても setup は走らない
    trigger();
    await Promise.resolve();
    await Promise.resolve();
    expect(setupFn).not.toHaveBeenCalled();
  });

  it("複数要素の同時発火が独立に処理される", async () => {
    const elA = makeEl();
    const elB = makeEl();
    const setupA = vi.fn();
    const setupB = vi.fn();

    const cues = new Map<HTMLElement, () => void>();
    const observers: {
      el?: HTMLElement;
      cb: (e: Partial<IntersectionObserverEntry>[]) => void;
    }[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        cb: (e: Partial<IntersectionObserverEntry>[]) => void;
        constructor(cb: (e: Partial<IntersectionObserverEntry>[]) => void) {
          this.cb = cb;
          observers.push({ cb });
        }
        observe(el: HTMLElement) {
          cues.set(el, () =>
            this.cb([
              {
                isIntersecting: true,
                target: el,
              } as Partial<IntersectionObserverEntry>,
            ]),
          );
        }
        disconnect() {}
      },
    );

    const { component } = create({
      scheduler: createScheduler({ priority: "user-blocking" }),
    });

    component({ name: "a", setup: setupA }, { when: visible() })(elA);
    component({ name: "b", setup: setupB }, { when: visible() })(elB);

    cues.get(elA)?.();
    cues.get(elB)?.();

    await Promise.resolve();
    await Promise.resolve();

    expect(setupA).toHaveBeenCalledOnce();
    expect(setupB).toHaveBeenCalledOnce();
  });
});
