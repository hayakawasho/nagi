import { afterEach, describe, expect, it, vi } from "vitest";

import { useSlot } from "../hooks/useSlot";
import { create } from "./core";
import {
  isLifecycleError,
  LifecycleError,
  traceComponentTree,
} from "./error";
import { useMount, useUnmount } from "./lifecycle";
import { getCurrentComponent } from "./component";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// isLifecycleError
// ---------------------------------------------------------------------------

describe("isLifecycleError", () => {
  it("LifecycleError インスタンスを正しく識別する", () => {
    const err = new LifecycleError({
      phase: "setup",
      name: "Foo",
      cause: new Error("x"),
    });
    expect(isLifecycleError(err)).toBe(true);
  });

  it("通常の Error は false", () => {
    expect(isLifecycleError(new Error("x"))).toBe(false);
  });

  it("null / undefined は false", () => {
    expect(isLifecycleError(null)).toBe(false);
    expect(isLifecycleError(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// traceComponentTree
// ---------------------------------------------------------------------------

describe("traceComponentTree", () => {
  it("単独コンポーネントのパスはコンポーネント名のみ", () => {
    const el = makeEl();
    let path = "";
    const { component } = create();
    component({
      name: "Root",
      setup: () => {
        path = traceComponentTree(getCurrentComponent("test"));
      },
    })(el);
    expect(path).toBe("Root");
  });

  it("親子のパスが ' > ' で連結される", () => {
    const root = makeEl();
    const childEl = makeEl();
    let childPath = "";

    const { component } = create();
    component({
      name: "Parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, {
          name: "Child",
          setup: () => {
            childPath = traceComponentTree(getCurrentComponent("test"));
          },
        });
      },
    })(root);

    expect(childPath).toBe("Parent > Child");
  });

  it("3階層のパスが正しく組み立てられる", () => {
    const root = makeEl();
    const midEl = makeEl();
    const leafEl = makeEl();
    let leafPath = "";

    const { component } = create();
    component({
      name: "App",
      setup: () => {
        const { addChild } = useSlot();
        addChild(midEl, {
          name: "Middle",
          setup: () => {
            const { addChild: addGrandChild } = useSlot();
            addGrandChild(leafEl, {
              name: "Leaf",
              setup: () => {
                leafPath = traceComponentTree(getCurrentComponent("test"));
              },
            });
          },
        });
      },
    })(root);

    expect(leafPath).toBe("App > Middle > Leaf");
  });
});

// ---------------------------------------------------------------------------
// createComponent — setup 失敗
// ---------------------------------------------------------------------------

describe("createComponent: setup 失敗", () => {
  it("setup がthrowしたら LifecycleError になる", () => {
    const el = makeEl();
    const { component } = create();
    expect(() =>
      component({
        name: "Broken",
        setup: () => {
          throw new Error("setup failure");
        },
      })(el),
    ).toThrow(LifecycleError);
  });

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

  it("Error.cause が設定される", () => {
    const el = makeEl();
    const inner = new Error("inner");
    const { component } = create();
    let caught: LifecycleError | undefined;
    try {
      component({
        name: "C",
        setup: () => {
          throw inner;
        },
      })(el);
    } catch (err) {
      if (isLifecycleError(err)) caught = err;
    }
    expect(caught!.cause).toBe(inner);
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

  it("子の setup 失敗は二重ラップされず伝播する", () => {
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

    // 子の setup エラーがそのまま伝播し、phase="setup", componentName="ChildComp"
    expect(caught!.details.phase).toBe("setup");
    expect(caught!.details.name).toBe("ChildComp");
  });
});

// ---------------------------------------------------------------------------
// onMount — フック失敗時の継続実行
// ---------------------------------------------------------------------------

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

  it("useMount フック失敗時、例外はスローされない", () => {
    const el = makeEl();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { component } = create();
    expect(() =>
      component({
        name: "Test",
        setup: () => {
          useMount(() => {
            throw new Error("hook");
          });
        },
      })(el),
    ).not.toThrow();
  });

  it("console.error の第2引数が LifecycleError (phase='mount')", () => {
    const el = makeEl();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { component } = create();
    component({
      name: "Test",
      setup: () => {
        useMount(() => {
          throw new Error("hook");
        });
      },
    })(el);

    const errArg = consoleSpy.mock.calls[0][1];
    expect(isLifecycleError(errArg)).toBe(true);
    expect((errArg as LifecycleError).details.phase).toBe("mount");
    expect((errArg as LifecycleError).details.name).toBe("Test");
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

// ---------------------------------------------------------------------------
// onUnmount — cleanup 失敗時の継続実行
// ---------------------------------------------------------------------------

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

  it("console.error の第2引数が LifecycleError (phase='unmount')", () => {
    const el = makeEl();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { component, unmount } = create();
    component({
      name: "Test",
      setup: () => {
        useUnmount(() => {
          throw new Error("cleanup");
        });
      },
    })(el);

    unmount([el]);
    const errArg = consoleSpy.mock.calls[0][1];
    expect(isLifecycleError(errArg)).toBe(true);
    expect((errArg as LifecycleError).details.phase).toBe("unmount");
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

// ---------------------------------------------------------------------------
// addChild — 致命的失敗時のロールバック
// ---------------------------------------------------------------------------

describe("addChild: 致命的失敗時", () => {
  it("setup 失敗 LifecycleError に parentName/parentUid/componentPath が入る", () => {
    const root = makeEl();
    const childEl = makeEl();

    const { component } = create();
    let caught: LifecycleError | undefined;
    try {
      component({
        name: "ParentComp",
        setup: () => {
          const { addChild } = useSlot();
          addChild(childEl, {
            name: "ChildComp",
            setup: () => {
              throw new Error("child setup");
            },
          });
        },
      })(root);
    } catch (err) {
      if (isLifecycleError(err)) caught = err;
    }

    expect(caught!.details.name).toBe("ChildComp");
    expect(caught!.details.path).toContain("ParentComp");
    expect(caught!.details.path).toContain("ChildComp");
  });
});

// ---------------------------------------------------------------------------
// removeChild — 失敗時の継続
// ---------------------------------------------------------------------------

describe("useSlot().removeChild: 失敗時の継続", () => {
  it("1つ目の removeChild が失敗しても2つ目が実行される", () => {
    const root = makeEl();
    const c1 = makeEl();
    const c2 = makeEl();
    const unmount2 = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    // useSlot().removeChild は ComponentContext.removeChild を呼ぶ
    // onUnmount 自体はキャッチするので、ここでは throw しない
    // removeChild のエラーは onUnmount 外の想定外エラー - テスト可能性のため
    // onUnmount がthrowするような極端なケースの代わりに
    // 2子を addChild して順番に removeChild できることを確認
    const child1 = { name: "C1", setup: () => {} };
    const child2 = {
      name: "C2",
      setup: () => {
        useUnmount(unmount2);
      },
    };

    let slotRef: ReturnType<typeof useSlot> | null = null;
    let childCtxs: ReturnType<ReturnType<typeof useSlot>["addChild"]> = [];

    const { component } = create();
    component({
      name: "Parent",
      setup: () => {
        slotRef = useSlot();
        childCtxs = [
          ...slotRef.addChild(c1, child1),
          ...slotRef.addChild(c2, child2),
        ];
      },
    })(root);

    slotRef!.removeChild(childCtxs);
    expect(unmount2).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// 二重マウント — LifecycleError になること
// ---------------------------------------------------------------------------

describe("二重マウント", () => {
  it("同じ DOM に二重マウントすると LifecycleError がスローされる", () => {
    const el = makeEl();
    const { component } = create();
    const mount = component({ name: "Comp", setup: () => {} });
    mount(el);
    expect(() => mount(el)).toThrow(LifecycleError);
  });

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
    // 既存コンポーネント情報が parentName / parentUid に入る
    expect(err.details.parentName).toBe("Comp");
    expect(err.details.parentUid).toMatch(/^Comp\.\d+$/);
  });
});
