import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create } from "../core/app";

import { useIntersectionWatch } from "./useIntersectionWatch";

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedOptions: IntersectionObserverInit | undefined;

class MockIntersectionObserver {
  constructor(
    _cb: IntersectionObserverCallback,
    opts?: IntersectionObserverInit,
  ) {
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
    let unwatchFn: ((el: HTMLElement) => void) | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { unwatch } = useIntersectionWatch(target, vi.fn());
        unwatchFn = unwatch;
      },
    })(root);
    unwatchFn?.(target);
    expect(mockUnobserve).toHaveBeenCalledWith(target);
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
