import { afterEach, describe, expect, it, vi } from "vitest";

import { useSlot } from "../hooks/core/useSlot";

import { create } from "./app";
import { useDeferredUnmount, useUnmount } from "./lifecycle";
import { getCurrentComponent } from "./runtime";

import type { ComponentContextImpl } from "./_internal/component";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("runtime", () => {
  it("setup 外で hook を呼ぶと例外を投げる", () => {
    expect(() => getCurrentComponent("testHook")).toThrow();
  });
});

describe("useDeferredUnmount", () => {
  it("Promise が resolve するまで deferred が完了し、その後 useUnmount が呼ばれる", async () => {
    const order: string[] = [];
    const root = makeEl();
    const { component, unmount } = create();
    let resolveDeferred!: () => void;

    component({
      name: "test",
      setup: () => {
        useDeferredUnmount(() => {
          order.push("deferred");
          return new Promise<void>((resolve) => {
            resolveDeferred = resolve;
          });
        });
        useUnmount(() => {
          order.push("unmount");
        });
      },
    })(root);

    const unmountPromise = unmount([root]);
    await Promise.resolve();
    expect(order).toEqual(["deferred"]);

    resolveDeferred();
    await unmountPromise;
    expect(order).toEqual(["deferred", "unmount"]);
  });

  it("親 unmount 時、親と子の deferred callbacks がともに待たれてから useUnmount が実行される", async () => {
    const order: string[] = [];
    const root = makeEl();
    const childEl = makeEl();
    const { component, unmount } = create();
    let resolveParent!: () => void;
    let resolveChild!: () => void;

    component({
      name: "parent",
      setup: () => {
        useDeferredUnmount(
          () =>
            new Promise<void>((resolve) => {
              resolveParent = resolve;
            }),
        );
        useUnmount(() => {
          order.push("parent-unmount");
        });

        const { addChild } = useSlot();
        addChild(childEl, {
          name: "child",
          setup: () => {
            useDeferredUnmount(
              () =>
                new Promise<void>((resolve) => {
                  resolveChild = resolve;
                }),
            );
            useUnmount(() => {
              order.push("child-unmount");
            });
          },
        });
      },
    })(root);

    const unmountPromise = unmount([root]);
    await Promise.resolve();
    expect(order).toEqual([]);

    resolveParent();
    await Promise.resolve();
    expect(order).toEqual([]);

    resolveChild();
    await unmountPromise;
    expect(order).toEqual(["parent-unmount", "child-unmount"]);
  });

  it("ハンドラが reject しても兄弟ハンドラは実行され unmount 全体は resolve する", async () => {
    const root = makeEl();
    const sibling = vi.fn();
    const { component, unmount } = create();

    component({
      name: "test",
      setup: () => {
        useDeferredUnmount(() => Promise.reject(new Error("oops")));
        useDeferredUnmount(sibling);
      },
    })(root);

    await expect(unmount([root])).resolves.toBeUndefined();
    expect(sibling).toHaveBeenCalledOnce();
  });
});

describe("addChild ロールバック", () => {
  it("onMount が失敗した場合、child を親から切り離し unmount 連鎖に含めない", () => {
    const root = makeEl();
    const { component, unmount } = create();
    let parentCtx: ComponentContextImpl | undefined;

    component({
      name: "Parent",
      setup: () => {
        parentCtx = getCurrentComponent("test");
      },
    })(root);

    const childUnmount = vi.fn();
    const throwingChild = {
      parent: null as ComponentContextImpl | null,
      onMount: () => {
        throw new Error("onMount failed");
      },
      onUnmount: childUnmount,
    } as unknown as ComponentContextImpl;

    expect(() => parentCtx!.addChild(throwingChild)).toThrow();
    expect(throwingChild.parent).toBeNull();
    unmount([root]);
    expect(childUnmount).not.toHaveBeenCalled();
  });
});
