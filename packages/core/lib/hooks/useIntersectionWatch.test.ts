import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create } from "../core/app";

import { useIntersectionWatch } from "./useIntersectionWatch";

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedOptions: IntersectionObserverInit | undefined;
let observerCallback: IntersectionObserverCallback | undefined;

class MockIntersectionObserver {
  constructor(
    cb: IntersectionObserverCallback,
    opts?: IntersectionObserverInit,
  ) {
    observerCallback = cb;
    capturedOptions = opts;
  }
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();
  capturedOptions = undefined;
  observerCallback = undefined;
  document.body.innerHTML = "";
});

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("useIntersectionWatch", () => {
  it("ターゲットを observe する", () => {
    const root = makeEl();
    const target = makeEl();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useIntersectionWatch(target, vi.fn());
      },
    })(root);
    expect(mockObserve).toHaveBeenCalledWith(target);
  });

  it("配列のターゲットを全て observe する", () => {
    const root = makeEl();
    const t1 = makeEl();
    const t2 = makeEl();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useIntersectionWatch([t1, t2], vi.fn());
      },
    })(root);
    expect(mockObserve).toHaveBeenCalledWith(t1);
    expect(mockObserve).toHaveBeenCalledWith(t2);
  });

  it("デフォルトオプションが渡される", () => {
    const root = makeEl();
    const target = makeEl();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useIntersectionWatch(target, vi.fn());
      },
    })(root);
    expect(capturedOptions).toEqual({ rootMargin: "0px", threshold: 0.1 });
  });

  it("カスタムオプションを渡せる", () => {
    const root = makeEl();
    const target = makeEl();
    const opts: IntersectionObserverInit = { threshold: 0.5 };
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useIntersectionWatch(target, vi.fn(), opts);
      },
    })(root);
    expect(capturedOptions).toEqual(opts);
  });

  it("unwatch で個別要素の observe を解除できる", () => {
    const root = makeEl();
    const target = makeEl();
    const slot = {
      unwatch: (_el: HTMLElement) => {},
    };
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        slot.unwatch = useIntersectionWatch(target, vi.fn()).unwatch;
      },
    })(root);
    slot.unwatch(target);
    expect(mockUnobserve).toHaveBeenCalledWith(target);
  });

  it("IntersectionObserver の callback 発火時に listener が呼ばれる", () => {
    const root = makeEl();
    const target = makeEl();
    const callback = vi.fn();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useIntersectionWatch(target, callback);
      },
    })(root);

    const entry = {
      isIntersecting: true,
      target,
    } as unknown as IntersectionObserverEntry;
    observerCallback?.([entry], {} as IntersectionObserver);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith([entry], {} as IntersectionObserver);
  });

  it("アンマウント時に disconnect が呼ばれる", () => {
    const root = makeEl();
    const target = makeEl();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useIntersectionWatch(target, vi.fn());
      },
    })(root);
    unmount([root]);
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});
