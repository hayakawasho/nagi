import { afterEach, describe, expect, it, vi } from "vitest";

import { useSlot } from "../hooks/core/useSlot";

import { reportLifecycleError } from "./_internal/debugEvents";
import { defineAddon } from "./addon";
import { create } from "./app";
import { isLifecycleError } from "./error";
import { useDeferredUnmount, useMount, useUnmount } from "./lifecycle";

import type { ComponentContextImpl } from "./_internal/component";
import type { DebugEvent } from "./debugEvent";

function makeEl(tagName = "div"): HTMLElement {
  const el = document.createElement(tagName);
  document.body.appendChild(el);
  return el;
}

function debugReporter(reporter: (event: DebugEvent) => void) {
  return defineAddon({
    name: `probe-${crypto.randomUUID()}`,
    install(ctx) {
      ctx.addDebugReporter(reporter);
    },
  });
}

function errorsOf(events: DebugEvent[]): DebugEvent[] {
  return events.filter((event) => event.level === "error");
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("debug event", () => {
  it("setup throw で lifecycle error event が1回届く", () => {
    const events: DebugEvent[] = [];
    const root = makeEl();
    const childEl = makeEl("span");
    childEl.id = "child";
    childEl.classList.add("broken");
    const cause = new Error("broken");
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      create()
        .install(debugReporter((event) => events.push(event)))
        .component({
          name: "Parent",
          setup: () => {
            useSlot().addChild(childEl, {
              name: "Child",
              setup: () => {
                throw cause;
              },
            });
          },
        })(root);
    }).toThrow();

    const errors = errorsOf(events);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      version: 1,
      level: "error",
      source: "lifecycle",
      phase: "setup",
      name: "Child",
      path: "Parent > Child",
      parentUid: expect.stringMatching(/^Parent\.\d+$/),
      element: childEl,
      elementLabel: "span#child.broken",
      cause,
    });
    expect(errors[0].uid).toMatch(/^Child\.\d+$/);
  });

  it("mount / unmount / deferredUnmount error が event として届く", async () => {
    const events: DebugEvent[] = [];
    const root = makeEl();

    const { component, unmount } = create().install(
      debugReporter((event) => events.push(event)),
    );

    component({
      name: "App",
      setup: () => {
        useMount(() => {
          throw new Error("mount");
        });
        useDeferredUnmount(() => {
          throw new Error("deferred");
        });
        useUnmount(() => {
          throw new Error("unmount");
        });
      },
    })(root);
    await unmount([root]);

    expect(errorsOf(events).map((event) => event.phase)).toEqual([
      "mount",
      "deferredUnmount",
      "unmount",
    ]);
  });

  it("removeChild error が target の reporter に届く", async () => {
    const events: DebugEvent[] = [];
    const parent = {
      name: "Parent",
      uid: "Parent.0",
      parent: null,
      element: makeEl(),
    } as unknown as ComponentContextImpl;
    const child = {
      name: "Child",
      uid: "Child.0",
      parent,
      element: makeEl("span"),
      reporters: [(event: DebugEvent) => events.push(event)],
    } as unknown as ComponentContextImpl;

    reportLifecycleError("removeChild", child, new Error("remove"), parent);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      phase: "removeChild",
      name: "Child",
      parentUid: "Parent.0",
    });
  });

  it("reporter は app ごとに分離される（別 app には影響しない）", () => {
    const events: DebugEvent[] = [];
    const errorLog = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const appA = create().install(
      debugReporter((event) => events.push(event)),
    );
    const appB = create();

    const failing = {
      name: "App",
      setup: () => {
        useMount(() => {
          throw new Error("mount");
        });
      },
    };

    appB.component(failing)(makeEl());
    expect(errorsOf(events)).toHaveLength(0);
    expect(errorLog).toHaveBeenCalledOnce();

    appA.component(failing)(makeEl());
    expect(errorsOf(events)).toHaveLength(1);
    expect(errorLog).toHaveBeenCalledOnce();
  });

  it("複数の reporter を登録すると全てに通知される", () => {
    const first = vi.fn();
    const second = vi.fn();

    const { component } = create()
      .install(
        debugReporter((event) => event.level === "error" && first(event)),
      )
      .install(
        debugReporter((event) => event.level === "error" && second(event)),
      );

    component({
      name: "App",
      setup: () => {
        useMount(() => {
          throw new Error("mount");
        });
      },
    })(makeEl());

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("mount 後に install した reporter にも以降のエラーが届く", async () => {
    const events: DebugEvent[] = [];
    const root = makeEl();
    const app = create();

    app.component({
      name: "App",
      setup: () => {
        useUnmount(() => {
          throw new Error("unmount");
        });
      },
    })(root);

    app.install(debugReporter((event) => events.push(event)));
    await app.unmount([root]);

    const errors = errorsOf(events);

    expect(errors).toHaveLength(1);
    expect(errors[0].phase).toBe("unmount");
  });

  it("reporter が throw しても lifecycle は継続する", () => {
    const root = makeEl();
    const second = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { component } = create().install(
      defineAddon({
        name: "reporter",
        install(ctx) {
          ctx.addDebugReporter(() => {
            throw new Error("reporter");
          });
        },
      }),
    );

    component({
      name: "App",
      setup: () => {
        useMount(() => {
          throw new Error("mount");
        });
        useMount(second);
      },
    })(root);

    expect(second).toHaveBeenCalledOnce();
  });

  it("mount 後に addChild された子のエラーも app の reporter に届く", () => {
    const events: DebugEvent[] = [];
    const root = makeEl();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const ctx = create()
      .install(debugReporter((event) => events.push(event)))
      .component({
        name: "Parent",
        setup: () => {
          const slot = useSlot();

          return {
            add: (el: HTMLElement) =>
              slot.addChild(el, {
                name: "Child",
                setup: () => {
                  useMount(() => {
                    throw new Error("late child mount");
                  });
                },
              }),
          };
        },
      })(root);

    ctx?.current.add(makeEl("span"));

    const errors = errorsOf(events);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      phase: "mount",
      name: "Child",
      path: "Parent > Child",
    });
  });

  it("default reporter は既存互換の LifecycleError を1回だけ出力する", () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const cause = new Error("mount");

    create().component({
      name: "App",
      setup: () => {
        useMount(() => {
          throw cause;
        });
      },
    })(makeEl());

    expect(errorLog).toHaveBeenCalledOnce();
    expect(errorLog.mock.calls[0][0]).toBe("[nagi] onMount hook failed");
    expect(isLifecycleError(errorLog.mock.calls[0][1])).toBe(true);
  });
});

describe("debug info event", () => {
  it("mount / unmount で info event が届く", async () => {
    const events: DebugEvent[] = [];
    const root = makeEl();
    root.id = "app";

    const app = create().install(
      debugReporter((event) => events.push(event)),
    );

    app.component({
      name: "App",
      setup: () => {},
    })(root);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      version: 1,
      level: "info",
      source: "lifecycle",
      phase: "mount",
      name: "App",
      element: root,
      elementLabel: "div#app",
    });
    expect(events[0].uid).toMatch(/^App\.\d+$/);

    await app.unmount([root]);

    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      level: "info",
      source: "lifecycle",
      phase: "unmount",
      name: "App",
    });
  });

  it("親子は mount / unmount とも子が先に届く", async () => {
    const events: DebugEvent[] = [];
    const root = makeEl();

    const app = create().install(
      debugReporter((event) => events.push(event)),
    );

    app.component({
      name: "Parent",
      setup: () => {
        useSlot().addChild(makeEl("span"), {
          name: "Child",
          setup: () => {},
        });
      },
    })(root);
    await app.unmount([root]);

    expect(events.map((event) => `${event.phase}:${event.name}`)).toEqual([
      "mount:Child",
      "mount:Parent",
      "unmount:Child",
      "unmount:Parent",
    ]);
    expect(events[0].parentUid).toBe(events[1].uid);
  });

  it("unmount info は冪等ガードにより1回しか届かない", async () => {
    const events: DebugEvent[] = [];
    const root = makeEl();

    const app = create().install(
      debugReporter((event) => events.push(event)),
    );

    app.component({
      name: "App",
      setup: () => {},
    })(root);

    await app.unmount([root]);
    await app.unmount([root]);

    const unmounts = events.filter((event) => event.phase === "unmount");

    expect(unmounts).toHaveLength(1);
  });

  it("reporter 未登録なら info はコンソールにも出ない(完全に無音)", () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const infoLog = vi.spyOn(console, "info").mockImplementation(() => {});

    create().component({
      name: "App",
      setup: () => {},
    })(makeEl());

    expect(errorLog).not.toHaveBeenCalled();
    expect(infoLog).not.toHaveBeenCalled();
  });
});
