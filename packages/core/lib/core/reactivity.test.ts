import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "./app";
import { readonly, signal, useComputed, useWatch } from "./reactivity";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("readonly", () => {
  it("元の Signal の変更が ReadonlySignal に反映される", () => {
    const r = signal(10);
    const ro = readonly(r);
    r.value = 20;
    expect(ro.value).toBe(20);
  });
});

describe("useWatch", () => {
  it("Signal の値変更時に newVal と oldVal を渡して同期的に通知する", () => {
    const el = makeEl();
    const r = signal(0);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    r.value = 1;
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(1, 0);
  });

  it("同値代入では通知しない", () => {
    const el = makeEl();
    const r = signal(0);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    r.value = 0;
    expect(callback).not.toHaveBeenCalled();
  });

  it("NaN の再代入では通知しない", () => {
    const el = makeEl();
    const r = signal(Number.NaN);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    r.value = Number.NaN;
    expect(callback).not.toHaveBeenCalled();
  });

  it("ReadonlySignal 経由でも元の Signal の変更を通知する", () => {
    const el = makeEl();
    const r = signal(10);
    const ro = readonly(r);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(ro, callback);
      },
    })(el);

    r.value = 20;
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(20, 10);
  });

  it("複数 useWatch は登録順に呼ばれる", () => {
    const el = makeEl();
    const r = signal(0);
    const calls: string[] = [];
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, () => calls.push("first"));
        useWatch(r, () => calls.push("second"));
      },
    })(el);

    r.value = 1;
    expect(calls).toEqual(["first", "second"]);
  });

  it("component unmount 時に unsubscribe する", () => {
    const el = makeEl();
    const r = signal(0);
    const callback = vi.fn();
    const { component, unmount } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    r.value = 1;
    unmount([el]);
    r.value = 2;

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(1, 0);
  });
});

describe("useComputed", () => {
  it("依存 signal の変更で再計算される", () => {
    const el = makeEl();
    const a = signal(1);
    const b = signal(10);
    const { component } = create();

    let c: ReturnType<typeof useComputed<number>>;

    component({
      name: "test",
      setup: () => {
        c = useComputed(() => a.value + b.value);
      },
    })(el);

    expect(c!.value).toBe(11);
    a.value = 2;
    expect(c!.value).toBe(12);
    b.value = 20;
    expect(c!.value).toBe(22);
  });

  it("同じ signal を複数回読んでも重複購読しない", () => {
    const el = makeEl();
    const r = signal(1);
    const evalCount = vi.fn();
    const { component } = create();

    let c: ReturnType<typeof useComputed<number>>;

    component({
      name: "test",
      setup: () => {
        c = useComputed(() => {
          evalCount();
          return r.value + r.value;
        });
      },
    })(el);

    evalCount.mockClear();
    r.value = 2;
    expect(evalCount).toHaveBeenCalledOnce();
    expect(c!.value).toBe(4);
  });

  it("同値代入では再計算しない", () => {
    const el = makeEl();
    const r = signal(5);
    const evalCount = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useComputed(() => {
          evalCount();
          return r.value;
        });
      },
    })(el);

    evalCount.mockClear();
    r.value = 5;
    expect(evalCount).not.toHaveBeenCalled();
  });

  it("ネスト useComputed（useComputed が useComputed に依存）", () => {
    const el = makeEl();
    const r = signal(1);
    const { component } = create();

    let inner: ReturnType<typeof useComputed<number>>;
    let outer: ReturnType<typeof useComputed<number>>;

    component({
      name: "test",
      setup: () => {
        inner = useComputed(() => r.value * 2);
        outer = useComputed(() => inner!.value + 1);
      },
    })(el);

    expect(outer!.value).toBe(3);
    r.value = 5;
    expect(inner!.value).toBe(10);
    expect(outer!.value).toBe(11);
  });

  it("readonly 経由で参照しても依存追跡できる", () => {
    const el = makeEl();
    const r = signal(1);
    const ro = readonly(r);
    const { component } = create();

    let c: ReturnType<typeof useComputed<number>>;

    component({
      name: "test",
      setup: () => {
        c = useComputed(() => ro.value * 3);
      },
    })(el);

    expect(c!.value).toBe(3);
    r.value = 4;
    expect(c!.value).toBe(12);
  });

  it("component unmount 後は再計算されない", () => {
    const el = makeEl();
    const r = signal(0);
    const evalCount = vi.fn();
    const { component, unmount } = create();

    let c: ReturnType<typeof useComputed<number>>;

    component({
      name: "test",
      setup: () => {
        c = useComputed(() => {
          evalCount();
          return r.value;
        });
      },
    })(el);

    evalCount.mockClear();
    unmount([el]);
    r.value = 1;
    expect(evalCount).not.toHaveBeenCalled();
    expect(c!.value).toBe(0);
  });
});
