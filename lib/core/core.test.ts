import { afterEach, describe, expect, it, vi } from "vitest";

import { create, defineComponent } from "./core";
import { useMount, useUnmount } from "./lifecycle";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("create", () => {
  it("component と unmount を返す", () => {
    const app = create();
    expect(typeof app.component).toBe("function");
    expect(typeof app.unmount).toBe("function");
  });

  it("component(wrap) でコンポーネントをマウントできる", () => {
    const el = makeEl();
    const setupFn = vi.fn().mockReturnValue({ value: 1 });
    const { component } = create();
    const ctx = component({ name: "test", setup: setupFn })(el);
    expect(setupFn).toHaveBeenCalledWith(el, {});
    expect(ctx.current).toEqual({ value: 1 });
  });

  it("props を渡せる", () => {
    const el = makeEl();
    const setupFn = vi.fn();
    const { component } = create();
    component({ name: "test", setup: setupFn })(el, { x: 1 });
    expect(setupFn).toHaveBeenCalledWith(el, { x: 1 });
  });

  it("同じ要素に二重マウントすると例外を投げる", () => {
    const el = makeEl();
    const { component } = create();
    const mount = component({ name: "test", setup: () => {} });
    mount(el);
    expect(() => mount(el)).toThrow();
  });

  it("unmount でアンマウントハンドラが実行される", () => {
    const el = makeEl();
    const fn = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useUnmount(fn);
      },
    })(el);
    unmount([el]);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("unmount 対象でない要素は無視される", () => {
    const el = makeEl();
    const other = makeEl();
    const fn = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useUnmount(fn);
      },
    })(el);
    unmount([other]); // 別の要素
    expect(fn).not.toHaveBeenCalled();
  });

  it("unmount 後に同じ要素へ再マウントできる", () => {
    const el = makeEl();
    const { component, unmount } = create();
    const mount = component({ name: "test", setup: () => {} });
    mount(el);
    unmount([el]);
    expect(() => mount(el)).not.toThrow();
  });
});

describe("defineComponent", () => {
  it("options オブジェクトをそのまま返す", () => {
    const opts = { name: "foo", setup: () => {} };
    expect(defineComponent(opts)).toBe(opts);
  });

  it("引数なしで呼ぶとカリー化された関数を返す", () => {
    const factory = defineComponent<{ ctx: string }>();
    const makeComp = factory({
      name: "curried",
      setup: (_el, context) => ({ ctx: context }),
    });
    const comp = makeComp({ ctx: "hello" });
    expect(comp.name).toBe("curried");

    const el = makeEl();
    const { component } = create();
    const ctx = component(comp)(el);
    expect(ctx.current).toEqual({ ctx: { ctx: "hello" } });
  });
});

describe("useMount / useUnmount 基本動作", () => {
  it("useMount ハンドラはマウント時に実行される", () => {
    const el = makeEl();
    const fn = vi.fn();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useMount(fn);
      },
    })(el);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("useUnmount ハンドラはアンマウント時に実行される", () => {
    const el = makeEl();
    const fn = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useUnmount(fn);
      },
    })(el);
    unmount([el]);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("useMount ハンドラの戻り値 (cleanup) はアンマウント時に実行される", () => {
    const el = makeEl();
    const cleanup = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useMount(() => cleanup);
      },
    })(el);
    expect(cleanup).not.toHaveBeenCalled();
    unmount([el]);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("setup 外で useMount を呼ぶと例外を投げる", () => {
    expect(() => useMount(() => {})).toThrow();
  });
});
