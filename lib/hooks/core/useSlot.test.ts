import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "../../core/app";
import { defineComponent } from "../../core/component";
import { useMount, useUnmount } from "../../core/lifecycle";
import { propTypes } from "../../core/props";

import { useSlot } from "./useSlot";

function makeRoot(childEl: HTMLElement): HTMLElement {
  const root = document.createElement("div");
  root.appendChild(childEl);
  document.body.appendChild(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useSlot", () => {
  it("addChild した子は親の onMount 後にマウントされる", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

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
        addChild(childEl, child);
      },
    })(root);

    expect(mountFn).toHaveBeenCalledOnce();
  });

  it("removeChild で子コンポーネントをアンマウントできる", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

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
        childCtx = slotRef.addChild(childEl, child);
      },
    })(root);

    expect(unmountFn).not.toHaveBeenCalled();
    slotRef!.removeChild(childCtx);
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
        addChild([c1, c2], child);
      },
    })(root);

    expect(setupFn).toHaveBeenCalledTimes(2);
  });

  it("親アンマウント時に子も連鎖してアンマウントされる", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

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
        addChild(childEl, child);
      },
    })(root);

    unmount([root]);
    expect(unmountFn).toHaveBeenCalledOnce();
  });

  it("addChild で props を子コンポーネントに渡せる", () => {
    const childEl = document.createElement("button");
    const root = makeRoot(childEl);

    let capturedLabel = "";
    const child = defineComponent({
      name: "child",
      props: propTypes<{ label: string }>(),
      setup(_el, props) {
        capturedLabel = props.label;
      },
    });

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child, { label: "From parent" });
      },
    })(root);

    expect(capturedLabel).toBe("From parent");
  });
});
