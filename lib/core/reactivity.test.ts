import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "./app";
import { computed, readonly, ref, useWatch } from "./reactivity";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ref", () => {
  it("初期値を持つ Ref を作成できる", () => {
    const r = ref(42);
    expect(r.value).toBe(42);
  });

  it("value を書き換えられる", () => {
    const r = ref(0);
    r.value = 99;
    expect(r.value).toBe(99);
  });

  it("各種型に対応できる", () => {
    expect(ref("hello").value).toBe("hello");
    expect(ref(false).value).toBe(false);
    expect(ref(null).value).toBeNull();
    const obj = { a: 1 };
    expect(ref(obj).value).toBe(obj);
  });
});

describe("readonly", () => {
  it("ReadonlyRef は元の Ref の値を返す", () => {
    const r = ref(10);
    const ro = readonly(r);
    expect(ro.value).toBe(10);
  });

  it("元の Ref を変更すると ReadonlyRef にも反映される", () => {
    const r = ref(10);
    const ro = readonly(r);
    r.value = 20;
    expect(ro.value).toBe(20);
  });

  it("ReadonlyRef に setter は存在しないため代入すると例外を投げる", () => {
    const r = ref(10);
    const ro = readonly(r);
    expect(() => {
      // @ts-expect-error: ReadonlyRef には setter がない
      ro.value = 99;
    }).toThrow(TypeError);
    // value は書き換わっていない
    expect(ro.value).toBe(10);
  });
});

describe("useWatch", () => {
  it("Ref の値変更時に newVal と oldVal を渡して同期的に通知する", () => {
    const el = makeEl();
    const r = ref(0);
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
    const r = ref(0);
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
    const r = ref(Number.NaN);
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

  it("ReadonlyRef 経由でも元の Ref の変更を通知する", () => {
    const el = makeEl();
    const r = ref(10);
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

  it("component unmount 後は通知しない", () => {
    const el = makeEl();
    const r = ref(0);
    const callback = vi.fn();
    const { component, unmount } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    unmount([el]);
    r.value = 1;
    expect(callback).not.toHaveBeenCalled();
  });

  it("複数 useWatch は登録順に呼ばれる", () => {
    const el = makeEl();
    const r = ref(0);
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
    const r = ref(0);
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

describe("computed", () => {
  it("初期値が即評価される", () => {
    const el = makeEl();
    const { component } = create();

    let c: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        c = computed(() => 42);
      },
    })(el);

    expect(c!.value).toBe(42);
  });

  it("単一 ref 依存で値変更時に再計算される", () => {
    const el = makeEl();
    const r = ref(1);
    const { component } = create();

    let c: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        c = computed(() => r.value * 2);
      },
    })(el);

    expect(c!.value).toBe(2);
    r.value = 3;
    expect(c!.value).toBe(6);
  });

  it("複数 ref 依存で片方変更時に再計算される", () => {
    const el = makeEl();
    const a = ref(1);
    const b = ref(10);
    const { component } = create();

    let c: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        c = computed(() => a.value + b.value);
      },
    })(el);

    expect(c!.value).toBe(11);
    a.value = 2;
    expect(c!.value).toBe(12);
    b.value = 20;
    expect(c!.value).toBe(22);
  });

  it("同じ ref を複数回読んでも重複購読しない", () => {
    const el = makeEl();
    const r = ref(1);
    const evalCount = vi.fn();
    const { component } = create();

    let c: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        c = computed(() => {
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
    const r = ref(5);
    const evalCount = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        computed(() => {
          evalCount();
          return r.value;
        });
      },
    })(el);

    evalCount.mockClear();
    r.value = 5;
    expect(evalCount).not.toHaveBeenCalled();
  });

  it("ネスト computed（computed が computed に依存）", () => {
    const el = makeEl();
    const r = ref(1);
    const { component } = create();

    let inner: ReturnType<typeof computed<number>>;
    let outer: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        inner = computed(() => r.value * 2);
        outer = computed(() => inner!.value + 1);
      },
    })(el);

    expect(outer!.value).toBe(3);
    r.value = 5;
    expect(inner!.value).toBe(10);
    expect(outer!.value).toBe(11);
  });

  it("readonly 経由で参照しても依存追跡できる", () => {
    const el = makeEl();
    const r = ref(1);
    const ro = readonly(r);
    const { component } = create();

    let c: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        c = computed(() => ro.value * 3);
      },
    })(el);

    expect(c!.value).toBe(3);
    r.value = 4;
    expect(c!.value).toBe(12);
  });

  it("component unmount 後は再計算されない", () => {
    const el = makeEl();
    const r = ref(0);
    const evalCount = vi.fn();
    const { component, unmount } = create();

    let c: ReturnType<typeof computed<number>>;

    component({
      name: "test",
      setup: () => {
        c = computed(() => {
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

  it("setup() 外で呼ぶとエラーになる", () => {
    expect(() => {
      computed(() => 1);
    }).toThrow();
  });
});
