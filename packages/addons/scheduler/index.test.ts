import { create, defineAddon, useSlot, useUnmount } from "@usenagi/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { schedulerAddon } from "./index";

import type { Cue, DebugEvent, SchedulePriority } from "@usenagi/core";

function createWithScheduler(opts?: { priority?: SchedulePriority }) {
  return create().install(schedulerAddon(opts));
}

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("schedulerAddon — component() の戻り値", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("mount が遅延するため undefined を返す（current は取れない）", () => {
    const el = makeEl();
    const { component } = createWithScheduler({ priority: "user-blocking" });

    const result = component({ name: "test", setup: () => ({ value: 1 }) })(el);

    expect(result).toBeUndefined();
  });
});

describe("schedulerAddon — native postTask", () => {
  it("postTask に priority と signal を渡す", async () => {
    const postTask = vi.fn(
      (
        task: () => void,
        _opts?: { priority?: SchedulePriority; signal?: AbortSignal },
      ) => {
        task();
        return Promise.resolve();
      },
    );
    vi.stubGlobal("scheduler", { postTask });
    const setupFn = vi.fn();
    const el = makeEl();

    const { component } = createWithScheduler({ priority: "background" });
    component(
      { name: "test", setup: setupFn },
      { priority: "user-blocking" },
    )(el);

    await Promise.resolve();

    expect(postTask).toHaveBeenCalledOnce();
    expect(postTask.mock.calls[0]?.[1]).toMatchObject({
      priority: "user-blocking",
    });
    expect(postTask.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it("postTask が AbortError で reject しても unhandledrejection を増やさない", async () => {
    const abortErr = new DOMException("aborted", "AbortError");
    const postTask = vi.fn().mockRejectedValue(abortErr);
    vi.stubGlobal("scheduler", { postTask });

    const setupFn = vi.fn();
    const el = makeEl();
    const unhandled: unknown[] = [];
    const onUnhandled = (e: PromiseRejectionEvent) => {
      unhandled.push(e.reason);
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    const { component } = createWithScheduler();
    component({ name: "test", setup: setupFn })(el);

    await Promise.resolve();
    await Promise.resolve();

    window.removeEventListener("unhandledrejection", onUnhandled);
    expect(unhandled).toHaveLength(0);
  });
});

describe("schedulerAddon — 同一インスタンスを複数 app", () => {
  it("別 app に install しても pending を共有しない", async () => {
    vi.stubGlobal("scheduler", undefined);
    const addon = schedulerAddon({ priority: "user-blocking" });
    const elA = makeEl();
    const elB = makeEl();
    const setupA = vi.fn();
    const setupB = vi.fn();

    const appA = create();
    const appB = create();
    appA.install(addon);
    appB.install(addon);

    appA.component({ name: "a", setup: setupA })(elA);
    appB.component({ name: "b", setup: setupB })(elB);

    await Promise.resolve();
    expect(setupA).toHaveBeenCalledOnce();
    expect(setupB).toHaveBeenCalledOnce();

    appA.unmount([elA]);
    await Promise.resolve();
    expect(setupB).toHaveBeenCalledTimes(1);
  });
});

describe("scheduler — user-blocking (queueMicrotask)", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("user-blocking: setup が microtask で実行される", async () => {
    const el = makeEl();
    const setupFn = vi.fn();
    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({ name: "test", setup: setupFn })(el);
    expect(setupFn).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(setupFn).toHaveBeenCalledOnce();
  });
});

describe("scheduler — user-visible (requestAnimationFrame)", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("user-visible: setup が rAF で実行される", async () => {
    const el = makeEl();
    const setupFn = vi.fn();
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      setTimeout(() => cb(0), 0);
      return 1;
    });

    const { component } = createWithScheduler({ priority: "user-visible" });
    component({ name: "test", setup: setupFn })(el);
    expect(setupFn).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it("priority: user-blocking で個別上書きできる", async () => {
    const el = makeEl();
    const setupFn = vi.fn();
    const { component } = createWithScheduler({ priority: "user-visible" });

    component(
      { name: "test", setup: setupFn },
      { priority: "user-blocking" },
    )(el);
    expect(setupFn).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(setupFn).toHaveBeenCalledOnce();
  });
});

describe("scheduler — unmount によるキャンセル", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("mount 前に unmount を呼ぶと pending task がキャンセルされ setup が実行されない", async () => {
    const el = makeEl();
    const setupFn = vi.fn();

    const { component, unmount } = createWithScheduler({
      priority: "user-blocking",
    });
    component({ name: "test", setup: setupFn })(el);

    unmount([el]);

    await Promise.resolve();
    expect(setupFn).not.toHaveBeenCalled();
  });

  it("mount 完了後の unmount はキャンセルされず onUnmount が実行される", async () => {
    const el = makeEl();
    const unmountFn = vi.fn();

    const { component, unmount } = createWithScheduler({
      priority: "user-blocking",
    });
    component({
      name: "test",
      setup: () => {
        useUnmount(unmountFn);
      },
    })(el);

    await Promise.resolve();
    await unmount([el]);
    expect(unmountFn).toHaveBeenCalledOnce();
  });
});

describe("scheduler — 同一要素への二重登録", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("後勝ちで最初のペンディングは abort され、最新だけ setup が実行される", async () => {
    const el = makeEl();
    const setupFirst = vi.fn();
    const setupSecond = vi.fn();

    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({ name: "first", setup: setupFirst })(el);
    component({ name: "second", setup: setupSecond })(el);

    await Promise.resolve();

    expect(setupFirst).not.toHaveBeenCalled();
    expect(setupSecond).toHaveBeenCalledOnce();
  });
});

describe("scheduler — background (requestIdleCallback / setTimeout)", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("background: setup が requestIdleCallback で実行される", async () => {
    const el = makeEl();
    const setupFn = vi.fn();
    let idleCb!: () => void;

    vi.stubGlobal("requestIdleCallback", (fn: () => void) => {
      idleCb = fn;
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    const { component } = createWithScheduler({ priority: "background" });
    component({ name: "test", setup: setupFn })(el);
    expect(setupFn).not.toHaveBeenCalled();

    idleCb();
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it("background: rIC が無ければ setTimeout にフォールバック", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.stubGlobal("cancelIdleCallback", undefined);

    const el = makeEl();
    const setupFn = vi.fn();
    const { component } = createWithScheduler({ priority: "background" });
    component({ name: "test", setup: setupFn })(el);
    expect(setupFn).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(setupFn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});

describe("scheduler — when エラー", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("AbortError 以外で reject すると setup は走らず reason が throw される", async () => {
    const el = makeEl();
    const setupFn = vi.fn();
    const reason = new Error("cue failed");
    const when = () => Promise.reject(reason);
    const thrown: unknown[] = [];

    vi.spyOn(globalThis, "queueMicrotask").mockImplementation((fn) => {
      try {
        fn();
      } catch (error) {
        thrown.push(error);
      }
    });

    const { component } = createWithScheduler({ priority: "user-blocking" });
    component({ name: "test", setup: setupFn }, { when })(el);

    await Promise.resolve();
    await Promise.resolve();

    expect(setupFn).not.toHaveBeenCalled();
    expect(thrown).toEqual([reason]);
  });
});

describe("useSlot.addChild — scheduler を経由しない", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("addChild 内のマウントは parent setup 完了と同時に同期実行される", async () => {
    const el = makeEl();
    const childEl = makeEl();
    const childSetupFn = vi.fn();

    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        addChild(childEl, { name: "child", setup: childSetupFn });
      },
    })(el);

    expect(childSetupFn).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(childSetupFn).toHaveBeenCalledOnce();
  });
});

describe("schedulerAddon — debug info event", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  function debugProbe(events: DebugEvent[]) {
    return defineAddon({
      name: `probe-${crypto.randomUUID()}`,
      install(ctx) {
        ctx.addDebugReporter((event) => events.push(event));
      },
    });
  }

  it("cue 待ちで pending → resolved が届き、mount info が続く", async () => {
    const events: DebugEvent[] = [];
    let resolveCue!: () => void;
    const cue: Cue = () =>
      new Promise<void>((resolve) => {
        resolveCue = resolve;
      });
    cue.cueLabel = "manual";
    const el = makeEl();

    const app = create().install(
      schedulerAddon({ priority: "user-blocking" }),
      debugProbe(events),
    );

    app.component({ name: "test", setup: () => {} }, { when: cue })(el);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      version: 1,
      level: "info",
      source: "scheduler",
      phase: "pending",
      name: "test",
      cueLabel: "manual",
      element: el,
      elementLabel: "div",
    });

    resolveCue();
    await new Promise((r) => setTimeout(r, 0));

    expect(events.map((event) => `${event.source}:${event.phase}`)).toEqual([
      "scheduler:pending",
      "scheduler:resolved",
      "lifecycle:mount",
    ]);
  });

  it("unmount で中断されると aborted が届く（ラベル未設定の cue は custom）", async () => {
    const events: DebugEvent[] = [];
    const cue: Cue = () => new Promise<void>(() => {});
    const el = makeEl();

    const app = create().install(
      schedulerAddon({ priority: "user-blocking" }),
      debugProbe(events),
    );

    app.component({ name: "test", setup: () => {} }, { when: cue })(el);
    await app.unmount([el]);

    expect(events.map((event) => `${event.source}:${event.phase}`)).toEqual([
      "scheduler:pending",
      "scheduler:aborted",
    ]);
    expect(events[1]).toMatchObject({ cueLabel: "custom" });
  });

  it("cue なしのマウントでは scheduler イベントを発行しない", async () => {
    const events: DebugEvent[] = [];
    const el = makeEl();

    const app = create().install(
      schedulerAddon({ priority: "user-blocking" }),
      debugProbe(events),
    );

    app.component({ name: "test", setup: () => {} })(el);
    await new Promise((r) => setTimeout(r, 0));

    expect(events.map((event) => `${event.source}:${event.phase}`)).toEqual([
      "lifecycle:mount",
    ]);
  });
});
