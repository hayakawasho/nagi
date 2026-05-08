import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "./core";
import { getCurrentComponent } from "./component";
import { useMount, useUnmount } from "./lifecycle";

import type { ComponentContext } from "./component";

function makeEl(id?: string): HTMLElement {
  const el = document.createElement("div");
  if (id) el.id = id;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ComponentContext", () => {
  it("uid が name.N 形式で生成される", () => {
    const el = makeEl();
    let uid = "";
    const { component } = create();
    component({
      name: "myComp",
      setup: () => {
        uid = getCurrentComponent("test").uid;
      },
    })(el);
    expect(uid).toMatch(/^myComp\.\d+$/);
  });

  it("element に DOM 要素が格納される", () => {
    const el = makeEl();
    let captured: HTMLElement | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        captured = getCurrentComponent("test").element as HTMLElement;
      },
    })(el);
    expect(captured).toBe(el);
  });

  it("props が格納される", () => {
    const el = makeEl();
    let capturedProps: Record<string, unknown> = {};
    const { component } = create();
    component({
      name: "test",
      setup: (_el, props) => {
        capturedProps = props as Record<string, unknown>;
      },
    })(el, { foo: "bar" });
    expect(capturedProps).toEqual({ foo: "bar" });
  });

  it("setup の戻り値が current に格納される", () => {
    const el = makeEl();
    const { component } = create();
    const ctx = component({
      name: "test",
      setup: () => ({ hello: "world" }),
    })(el);
    expect(ctx.current).toEqual({ hello: "world" });
  });

  it("onMount で MOUNTED ハンドラが実行される", () => {
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

  it("MOUNTED ハンドラが返した関数は UNMOUNTED に追加される", () => {
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

  it("onUnmount で UNMOUNTED ハンドラが実行される", () => {
    const el = makeEl();
    const fn = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useUnmount(fn);
      },
    })(el);
    expect(fn).not.toHaveBeenCalled();
    unmount([el]);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("provides Map がデフォルトで空", () => {
    const el = makeEl();
    let provideSize = -1;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        provideSize = getCurrentComponent("test").provides.size;
      },
    })(el);
    expect(provideSize).toBe(0);
  });
});

describe("getCurrentComponent", () => {
  it("setup 外で呼ぶと例外を投げる", () => {
    expect(() => getCurrentComponent("testHook")).toThrow();
  });
});

describe("addChild ロールバック", () => {
  it("onMount が失敗した場合、child.parent が null にリセットされる", () => {
    const root = makeEl();
    const { component } = create();
    let parentCtx: ComponentContext | undefined;

    component({
      name: "Parent",
      setup: () => {
        parentCtx = getCurrentComponent("test");
      },
    })(root);

    const throwingChild = {
      parent: null as ComponentContext | null,
      onMount: () => {
        throw new Error("onMount failed");
      },
      onUnmount: vi.fn(),
    } as unknown as ComponentContext;

    expect(() => parentCtx!.addChild(throwingChild)).toThrow();
    expect(throwingChild.parent).toBeNull();
  });

  it("onMount が失敗した場合、parent の onUnmount で child の onUnmount は呼ばれない", () => {
    const root = makeEl();
    const { component, unmount } = create();
    let parentCtx: ComponentContext | undefined;

    component({
      name: "Parent",
      setup: () => {
        parentCtx = getCurrentComponent("test");
      },
    })(root);

    const childUnmount = vi.fn();
    const throwingChild = {
      parent: null as ComponentContext | null,
      onMount: () => {
        throw new Error("onMount failed");
      },
      onUnmount: childUnmount,
    } as unknown as ComponentContext;

    expect(() => parentCtx!.addChild(throwingChild)).toThrow();
    unmount([root]);
    expect(childUnmount).not.toHaveBeenCalled();
  });
});
