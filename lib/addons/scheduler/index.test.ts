import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create } from "../../core/app";
import { useMount, useUnmount } from "../../core/lifecycle";

import { createScheduler, schedulerAddon } from "./index";
import * as task from "./task";

import type { SchedulePriority } from "../../types";

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
});

describe("createScheduler", () => {
  it("Scheduler インターフェースを返す", () => {
    const scheduler = createScheduler();
    expect(typeof scheduler.schedule).toBe("function");
  });

  it("default priority を指定できる", () => {
    const scheduler = createScheduler({ priority: "background" });
    expect(scheduler).toBeDefined();
  });
});

describe("createScheduler — globalThis.scheduler (native)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("schedule は postTask に priority と signal を渡す", () => {
    const postTask = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("scheduler", { postTask });

    const scheduler = createScheduler({ priority: "background" });
    const controller = new AbortController();
    const task = vi.fn();

    scheduler.schedule(task, {
      priority: "user-blocking",
      signal: controller.signal,
    });

    expect(postTask).toHaveBeenCalledOnce();
    expect(postTask).toHaveBeenCalledWith(task, {
      priority: "user-blocking",
      signal: controller.signal,
    });
  });

  it("createScheduler 後に globalThis.scheduler を差し替えても schedule が native を使う", () => {
    vi.stubGlobal("scheduler", undefined);
    const scheduler = createScheduler({ priority: "user-visible" });

    const postTask = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("scheduler", { postTask });

    scheduler.schedule(() => {});

    expect(postTask).toHaveBeenCalledOnce();
  });

  it("postTask が AbortError で reject しても unhandledrejection を増やさない", async () => {
    const abortErr = new DOMException("aborted", "AbortError");
    const postTask = vi.fn().mockRejectedValue(abortErr);
    vi.stubGlobal("scheduler", { postTask });

    const scheduler = createScheduler();
    const unhandled: unknown[] = [];
    const onUnhandled = (e: PromiseRejectionEvent) => {
      unhandled.push(e.reason);
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    scheduler.schedule(() => {});

    await Promise.resolve();
    await Promise.resolve();

    window.removeEventListener("unhandledrejection", onUnhandled);
    expect(unhandled).toHaveLength(0);
  });
});

describe("schedulerAddon — 基本動作", () => {
  it("schedulerAddon で component() が undefined を返す", () => {
    const el = makeEl();
    const { component } = createWithScheduler();
    expect(component({ name: "test", setup: () => {} })(el)).toBeUndefined();
  });

  it("scheduler なし (従来) は ComponentContext を返す", () => {
    const el = makeEl();
    const { component } = create();
    const result = component({ name: "test", setup: () => {} })(el);
    expect(result).toBeDefined();
    expect(result.name).toBe("test");
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
    // Prioritized Task Scheduling API がない環境を想定
    vi.stubGlobal("scheduler", undefined);
  });

  it("user-blocking: setup が microtask で実行される", async () => {
    const el = makeEl();
    const setupFn = vi.fn();
    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({ name: "test", setup: setupFn })(el);
    expect(setupFn).not.toHaveBeenCalled(); // まだ走っていない

    await Promise.resolve(); // microtask を消化
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it("user-blocking: useMount が microtask 後に実行される", async () => {
    const el = makeEl();
    const mountFn = vi.fn();
    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({
      name: "test",
      setup: () => {
        useMount(mountFn);
      },
    })(el);

    expect(mountFn).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(mountFn).toHaveBeenCalledOnce();
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

    // microtask 消化前に unmount → pending job がキャンセルされる
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

    await Promise.resolve(); // mount 完了
    unmount([el]);
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

  it("古いペンディングのコールバックが先に走っても complete が false で setup されない", () => {
    const el = makeEl();
    const setupFirst = vi.fn();
    const setupSecond = vi.fn();
    const callbacks: (() => void)[] = [];

    vi.spyOn(task, "scheduleTask").mockImplementation((fn) => {
      callbacks.push(fn);
    });

    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({ name: "first", setup: setupFirst })(el);
    component({ name: "second", setup: setupSecond })(el);

    expect(callbacks).toHaveLength(2);

    callbacks[0]?.();
    expect(setupFirst).not.toHaveBeenCalled();

    callbacks[1]?.();
    expect(setupFirst).not.toHaveBeenCalled();
    expect(setupSecond).toHaveBeenCalledOnce();
  });
});

describe("scheduler + unmount の連携", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("mount 完了後に unmount が正常に動く", async () => {
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

    await Promise.resolve(); // mount 完了

    unmount([el]);
    expect(unmountFn).toHaveBeenCalledOnce();
  });
});

describe("useSlot.addChild — scheduler を経由しない", () => {
  beforeEach(() => {
    vi.stubGlobal("scheduler", undefined);
  });

  it("addChild 内のマウントは parent setup 完了と同時に同期実行される", async () => {
    const { useSlot } = await import("../../hooks/useSlot");

    const el = makeEl();
    const childEl = makeEl();
    const childSetupFn = vi.fn();

    const { component } = createWithScheduler({ priority: "user-blocking" });

    component({
      name: "parent",
      setup: () => {
        const { addChild } = useSlot();
        // addChild は ComponentContext.addChild を直接呼ぶため scheduler 経由にならない
        addChild(childEl, { name: "child", setup: childSetupFn });
      },
    })(el);

    // parent setup 自体が microtask 経由なので、まだ走っていない
    expect(childSetupFn).not.toHaveBeenCalled();

    await Promise.resolve(); // microtask 消化 = parent setup 実行 → 内部で addChild も同期実行
    expect(childSetupFn).toHaveBeenCalledOnce();
  });
});
