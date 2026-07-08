import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "../../core/app";
import { defineAddon } from "../../core/addon";
import { defineComponent } from "../../core/component";
import { useDeferredUnmount, useMount, useUnmount } from "../../core/lifecycle";
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

  it("removeChild で子コンポーネントをアンマウントできる", async () => {
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
    await slotRef!.removeChild(childCtx);
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

  it("親アンマウント時に子も連鎖してアンマウントされる", async () => {
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

    await unmount([root]);
    expect(unmountFn).toHaveBeenCalledOnce();
  });

  it("await removeChild が子の deferred unmount 完了後に resolve する", async () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

    const order: string[] = [];
    const child = {
      name: "child",
      setup: () => {
        useDeferredUnmount(async () => {
          await Promise.resolve();
          order.push("deferred");
        });
        useUnmount(() => {
          order.push("unmount");
        });
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

    await slotRef!.removeChild(childCtx);
    expect(order).toEqual(["deferred", "unmount"]);
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

describe("useSlot — addon pipeline propagation", () => {
  it("addChild applies component middleware", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

    const calls: string[] = [];

    const trackingAddon = defineAddon({
      name: "tracking",
      install(ctx) {
        ctx.addComponentMiddleware((comp) => ({
          ...comp,
          setup(el, props) {
            calls.push(comp.name);
            return comp.setup(el, props);
          },
        }));
      },
    });

    const child = {
      name: "child",
      setup: () => {},
    };

    const { component } = create().install(trackingAddon);

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child);
      },
    })(root);

    expect(calls).toContain("child");
  });

  it("removeChild applies unmount middleware", async () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

    const unmountCalls: string[] = [];

    const trackingAddon = defineAddon({
      name: "tracking",
      install(ctx) {
        ctx.addUnmountMiddleware((next) => async (targets) => {
          unmountCalls.push("unmount-middleware");
          return next(targets);
        });
      },
    });

    let slotRef: ReturnType<typeof useSlot> | null = null;
    let childCtx: ReturnType<ReturnType<typeof useSlot>["addChild"]> = [];

    const child = {
      name: "child",
      setup: () => {},
    };

    const { component } = create().install(trackingAddon);

    component({
      name: "parent",
      setup: () => {
        slotRef = useSlot();
        childCtx = slotRef.addChild(childEl, child);
      },
    })(root);

    await slotRef!.removeChild(childCtx);
    expect(unmountCalls).toContain("unmount-middleware");
  });

  it("nested addChild propagates middleware", () => {
    const root = document.createElement("div");
    const childEl = document.createElement("span");
    const grandchildEl = document.createElement("em");
    childEl.appendChild(grandchildEl);
    root.appendChild(childEl);
    document.body.appendChild(root);

    const calls: string[] = [];

    const trackingAddon = defineAddon({
      name: "tracking",
      install(ctx) {
        ctx.addComponentMiddleware((comp) => ({
          ...comp,
          setup(el, props) {
            calls.push(comp.name);
            return comp.setup(el, props);
          },
        }));
      },
    });

    const grandchild = {
      name: "grandchild",
      setup: () => {},
    };

    const child = {
      name: "child",
      setup: () => {
        const { addChild } = useSlot();
        addChild(grandchildEl, grandchild);
      },
    };

    const { component } = create().install(trackingAddon);

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child);
      },
    })(root);

    expect(calls).toContain("child");
    expect(calls).toContain("grandchild");
  });

  it("late addChild (after setup) applies middleware", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

    const calls: string[] = [];

    const trackingAddon = defineAddon({
      name: "tracking",
      install(ctx) {
        ctx.addComponentMiddleware((comp) => ({
          ...comp,
          setup(el, props) {
            calls.push(comp.name);
            return comp.setup(el, props);
          },
        }));
      },
    });

    const child = {
      name: "late-child",
      setup: () => {},
    };

    let addLater: (() => void) | null = null;

    const { component } = create().install(trackingAddon);

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addLater = () => {
          addChild(childEl, child);
        };
      },
    })(root);

    expect(calls).not.toContain("late-child");

    addLater!();
    expect(calls).toContain("late-child");
  });

  it("mount middleware does NOT apply to addChild", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

    const mountCalls: string[] = [];

    const trackingAddon = defineAddon({
      name: "tracking",
      install(ctx) {
        ctx.addMountMiddleware((next, _setup, _opts) => (el, props) => {
          mountCalls.push("mount-middleware");
          return next(el, props);
        });
      },
    });

    const child = {
      name: "child",
      setup: () => {},
    };

    const { component } = create().install(trackingAddon);

    mountCalls.length = 0;

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child);
      },
    })(root);

    expect(mountCalls).toEqual(["mount-middleware"]);
  });

  it("addChild works without addons", () => {
    const childEl = document.createElement("span");
    const root = makeRoot(childEl);

    const setupFn = vi.fn();
    const child = {
      name: "child",
      setup: setupFn,
    };

    const { component } = create();

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, child);
      },
    })(root);

    expect(setupFn).toHaveBeenCalledOnce();
  });
});
