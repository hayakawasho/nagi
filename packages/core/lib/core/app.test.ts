import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "./app";
import { isLifecycleError, type LifecycleError } from "./error";
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

    it("setup が Promise を返すと LifecycleError を投げる", () => {
      const el = makeEl();
      const { component } = create();

      let caught: unknown;

      try {
        component({
          name: "test",
          // biome-ignore lint/suspicious/noExplicitAny: async setup は型で禁止されているため意図的に握りつぶす
          setup: (async () => {}) as any,
        })(el);
      } catch (e) {
        caught = e;
      }

      expect(isLifecycleError(caught)).toBe(true);
      expect(String((caught as LifecycleError).details.cause)).toMatch(
        /must be synchronous/,
      );
    });
  });

  describe("unmount()", () => {
    it("useUnmount のハンドラが実行される", async () => {
      const el = makeEl();
      const fn = vi.fn();
      const { component, unmount } = create();
      component({
        name: "test",
        setup: () => {
          useUnmount(fn);
        },
      })(el);
      await unmount([el]);
      expect(fn).toHaveBeenCalledOnce();
    });

    it("useMount の cleanup が実行される", async () => {
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
      await unmount([el]);
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
