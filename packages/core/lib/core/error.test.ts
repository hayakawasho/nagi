import { afterEach, describe, expect, it, vi } from "vitest";

import { useSlot } from "../hooks/core/useSlot";

import { create } from "./app";
import { isLifecycleError, LifecycleError } from "./error";
import { useMount, useUnmount } from "./lifecycle";
import { getCurrentComponent } from "./runtime";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("isLifecycleError", () => {
  it("LifecycleError インスタンスを正しく識別する", () => {
    const err = new LifecycleError({
      phase: "setup",
      name: "Foo",
      cause: new Error("x"),
    });
    expect(isLifecycleError(err)).toBe(true);
  });

  it("通常の Error / null / undefined は false", () => {
    expect(isLifecycleError(new Error("x"))).toBe(false);
    expect(isLifecycleError(null)).toBe(false);
    expect(isLifecycleError(undefined)).toBe(false);
  });
});

describe("createComponent: setup 失敗", () => {
  it("details に phase='setup', componentName, componentUid, componentPath, element, props, cause が入る", () => {
    const el = makeEl();
    const cause = new Error("inner");
    const { component } = create();
    let caught: LifecycleError | undefined;
    try {
      component({
        name: "BrokenComp",
        setup: () => {
          throw cause;
        },
      })(el, { key: "val" });
    } catch (err) {
      if (isLifecycleError(err)) caught = err;
    }

    expect(caught!.details.phase).toBe("setup");
    expect(caught!.details.name).toBe("BrokenComp");
    expect(caught!.details.uid).toMatch(/^BrokenComp\.\d+$/);
    expect(caught!.details.path).toBe("BrokenComp");
    expect(caught!.details.element).toBe(el);
    expect(caught!.details.props).toEqual({ key: "val" });
    expect(caught!.details.cause).toBe(cause);
  });

  it("setup 失敗後も current component context が親へ戻る (finally)", () => {
    const root = makeEl();
    const childEl = makeEl();
    let uidBefore: string | undefined;
    let uidAfter: string | undefined;

    const { component } = create();
    component({
      name: "Parent",
      setup: () => {
        uidBefore = getCurrentComponent("test").uid;
        const { addChild } = useSlot();
        try {
          addChild(childEl, {
            name: "BrokenChild",
            setup: () => {
              throw new Error("child failure");
            },
          });
        } catch {
          /* ignore */
        }
        uidAfter = getCurrentComponent("test").uid;
      },
    })(root);

    expect(uidAfter!).toBe(uidBefore!);
  });

  it("子の setup 失敗は二重ラップされず親子 path 付きで伝播する", () => {
    const root = makeEl();
    const childEl = makeEl();

    const { component } = create();
    let caught: LifecycleError | undefined;
    try {
      component({
        name: "Parent",
        setup: () => {
          const { addChild } = useSlot();
          addChild(childEl, {
            name: "ChildComp",
            setup: () => {
              throw new Error("child");
            },
          });
        },
      })(root);
    } catch (err) {
      if (isLifecycleError(err)) caught = err;
    }

    expect(caught!.details.phase).toBe("setup");
    expect(caught!.details.name).toBe("ChildComp");
    expect(caught!.details.path).toBe("Parent > ChildComp");
  });
});

describe("onMount: フック失敗時", () => {
  it("1つ目のフックが失敗しても2つ目のフックが実行される", () => {
    const el = makeEl();
    const second = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { component } = create();
    component({
      name: "Test",
      setup: () => {
        useMount(() => {
          throw new Error("hook1");
        });
        useMount(second);
      },
    })(el);

    expect(second).toHaveBeenCalledOnce();
  });

  it("失敗したフックの cleanup は UNMOUNTED に登録されない", () => {
    const el = makeEl();
    const cleanup = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { component, unmount } = create();
    component({
      name: "Test",
      setup: () => {
        useMount(() => {
          throw new Error("hook");
          // biome-ignore lint/correctness/noUnreachable: intentional
          return cleanup;
        });
      },
    })(el);
    unmount([el]);
    expect(cleanup).not.toHaveBeenCalled();
  });
});

describe("onUnmount: cleanup 失敗時", () => {
  it("1つ目の cleanup が失敗しても2つ目の cleanup が実行される", () => {
    const el = makeEl();
    const second = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { component, unmount } = create();
    component({
      name: "Test",
      setup: () => {
        useUnmount(() => {
          throw new Error("cleanup1");
        });
        useUnmount(second);
      },
    })(el);

    unmount([el]);
    expect(second).toHaveBeenCalledOnce();
  });

  it("子コンポーネントの unmount 失敗で親の cleanup が止まらない", () => {
    const root = makeEl();
    const childEl = makeEl();
    const parentCleanup = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { component, unmount } = create();
    component({
      name: "Parent",
      setup: () => {
        useUnmount(parentCleanup);
        const { addChild } = useSlot();
        addChild(childEl, {
          name: "Child",
          setup: () => {
            useUnmount(() => {
              throw new Error("child cleanup");
            });
          },
        });
      },
    })(root);

    unmount([root]);
    expect(parentCleanup).toHaveBeenCalledOnce();
  });
});

describe("二重マウント", () => {
  it("JSON 文字列エラーではなく LifecycleError になる", () => {
    const el = makeEl();
    const { component } = create();
    const mount = component({ name: "Comp", setup: () => {} });
    mount(el);

    let caught: unknown;
    try {
      mount(el);
    } catch (err) {
      caught = err;
    }

    expect(isLifecycleError(caught)).toBe(true);
    const err = caught as LifecycleError;
    expect(err.details.phase).toBe("mount");
    expect(err.details.name).toBe("Comp");
    expect(err.details.parentName).toBe("Comp");
    expect(err.details.parentUid).toMatch(/^Comp\.\d+$/);
  });
});
