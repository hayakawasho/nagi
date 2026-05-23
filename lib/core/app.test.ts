import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "./app";
import { useMount, useUnmount } from "./lifecycle";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("create — 同期 mount（addon なし）", () => {
  describe("component()", () => {
    it("setup に element と props を渡す", () => {
      const el = makeEl();
      const setupFn = vi.fn();
      const { component } = create();

      component({ name: "test", setup: setupFn })(el, { x: 1 });

      expect(setupFn).toHaveBeenCalledWith(el, { x: 1 });
    });

    it("ComponentContext を返す", () => {
      const el = makeEl();
      const { component } = create();

      const ctx = component({ name: "test", setup: () => {} })(el);

      expect(ctx).toBeDefined();
    });

    it("setup の return が current に入る（expose）", () => {
      const el = makeEl();
      const { component } = create();

      const ctx = component({
        name: "test",
        setup: () => ({ value: 1 }),
      })(el);

      expect(ctx).toBeDefined();
      expect(ctx?.current).toEqual({ value: 1 });
    });

    it("setup が void のとき current は空オブジェクト", () => {
      const el = makeEl();
      const { component } = create();

      const ctx = component({ name: "test", setup: () => {} })(el);

      expect(ctx).toBeDefined();
      expect(ctx?.current).toEqual({});
    });
  });

  describe("unmount()", () => {
    it("useUnmount のハンドラが実行される", () => {
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

    it("useMount の cleanup が実行される", () => {
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

    it("対象外の要素は無視される", () => {
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
      unmount([other]);
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
});
