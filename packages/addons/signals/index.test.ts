import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "@usenagi/core";
import {
  batch,
  readonly,
  signal,
  useComputed,
  useSignalEffect,
  useWatch,
} from "@usenagi/core/addons/signals";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("readonly", () => {
  it("元の Signal の変更が ReadonlySignal に反映される", () => {
    const r = signal(10);
    const ro = readonly(r);
    r.value = 20;
    expect(ro.value).toBe(20);
  });
});

describe("useWatch", () => {
  it("値変更時に newVal と oldVal を渡して同期的に通知する", () => {
    const el = makeEl();
    const r = signal(0);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    r.value = 1;
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(1, 0);
  });

  it("同値代入では通知しない", () => {
    const el = makeEl();
    const r = signal(0);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    r.value = 0;
    expect(callback).not.toHaveBeenCalled();
  });

  it("unmount 後は通知しない", async () => {
    const el = makeEl();
    const r = signal(0);
    const callback = vi.fn();
    const app = create();

    app.component({
      name: "test",
      setup: () => {
        useWatch(r, callback);
      },
    })(el);

    await app.unmount([el]);

    r.value = 1;
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("useComputed", () => {
  it("依存 Signal の変更で再計算される", () => {
    const a = signal(2);
    const b = signal(3);
    const area = useComputed(() => a.value * b.value);

    expect(area.value).toBe(6);
    a.value = 10;
    expect(area.value).toBe(30);
  });

  it("ダイヤモンド依存でも watcher は最終値のみを1回観測する（グリッチフリー）", () => {
    const el = makeEl();
    const a = signal(1);
    const b = useComputed(() => a.value + 1);
    const c = useComputed(() => a.value * 10);
    const d = useComputed(() => b.value + c.value);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(d, callback);
      },
    })(el);

    a.value = 2;
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(23, 12);
  });
});

describe("batch", () => {
  it("複数の更新を1回の通知にまとめる", () => {
    const el = makeEl();
    const a = signal(1);
    const b = signal(2);
    const sum = useComputed(() => a.value + b.value);
    const callback = vi.fn();
    const { component } = create();

    component({
      name: "test",
      setup: () => {
        useWatch(sum, callback);
      },
    })(el);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(30, 3);
  });
});

describe("useSignalEffect", () => {
  it("即時実行され、依存変更で再実行、unmount で停止する", async () => {
    const el = makeEl();
    const r = signal(0);
    const spy = vi.fn();
    const app = create();

    app.component({
      name: "test",
      setup: () => {
        useSignalEffect(() => {
          spy(r.value);
        });
      },
    })(el);

    expect(spy).toHaveBeenCalledWith(0);

    r.value = 1;
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledTimes(2);

    await app.unmount([el]);

    r.value = 2;
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
