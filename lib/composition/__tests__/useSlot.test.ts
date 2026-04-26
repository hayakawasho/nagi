import { afterEach, describe, expect, it, vi } from "vitest";
import { create } from "../../core/core";
import { useMount, useUnmount } from "../../core/lifecycle";
import { useSlot } from "../useSlot";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useSlot", () => {
  it("addChild で子コンポーネントをマウントできる", () => {
    const root = document.createElement("div");
    const childEl = document.createElement("span");
    root.appendChild(childEl);
    document.body.appendChild(root);

    const setupFn = vi.fn().mockReturnValue({ childValue: true });
    const child = { name: "child", setup: setupFn };
    let children: ReturnType<ReturnType<typeof useSlot>["addChild"]> = [];

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        children = addChild(childEl, child, {});
      },
    })(root);

    expect(setupFn).toHaveBeenCalledWith(childEl, {});
    expect(children).toHaveLength(1);
  });

  it("addChild した子は親の onMount 後にマウントされる", () => {
    const root = document.createElement("div");
    const childEl = document.createElement("span");
    root.appendChild(childEl);
    document.body.appendChild(root);

    const mountFn = vi.fn();
    const child = {
      name: "child",
      setup: () => {
        useMount(mountFn);
      },
    };

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child, {});
      },
    })(root);

    expect(mountFn).toHaveBeenCalledOnce();
  });

  it("removeChild で子コンポーネントをアンマウントできる", () => {
    const root = document.createElement("div");
    const childEl = document.createElement("span");
    root.appendChild(childEl);
    document.body.appendChild(root);

    const unmountFn = vi.fn();
    const child = {
      name: "child",
      setup: () => {
        useUnmount(unmountFn);
      },
    };

    let slotRef: ReturnType<typeof useSlot> | null = null;
    let childCtx: ReturnType<ReturnType<typeof useSlot>["addChild"]> = [];

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        slotRef = useSlot();
        childCtx = slotRef.addChild(childEl, child, {});
      },
    })(root);

    expect(unmountFn).not.toHaveBeenCalled();
    slotRef?.removeChild(childCtx);
    expect(unmountFn).toHaveBeenCalledOnce();
  });

  it("配列の要素に対して addChild すると複数の子を作れる", () => {
    const root = document.createElement("div");
    const c1 = document.createElement("span");
    const c2 = document.createElement("span");
    root.appendChild(c1);
    root.appendChild(c2);
    document.body.appendChild(root);

    const setupFn = vi.fn();
    const child = { name: "child", setup: setupFn };

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild([c1, c2], child, {});
      },
    })(root);

    expect(setupFn).toHaveBeenCalledTimes(2);
  });

  it("親アンマウント時に子も連鎖してアンマウントされる", () => {
    const root = document.createElement("div");
    const childEl = document.createElement("span");
    root.appendChild(childEl);
    document.body.appendChild(root);

    const unmountFn = vi.fn();
    const child = {
      name: "child",
      setup: () => {
        useUnmount(unmountFn);
      },
    };

    const { component, unmount } = create();
    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child, {});
      },
    })(root);

    unmount([root]);
    expect(unmountFn).toHaveBeenCalledOnce();
  });

  it("setup 外で呼ぶと例外を投げる", () => {
    expect(() => useSlot()).toThrow();
  });
});
