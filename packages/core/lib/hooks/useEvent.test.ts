import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "../core/app";

import { useEvent } from "./useEvent";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useEvent", () => {
  it("マウント後にイベントリスナーが動作する", () => {
    const el = document.createElement("button");
    document.body.appendChild(el);
    const handler = vi.fn();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useEvent(el, "click", handler);
      },
    })(el);

    el.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("アンマウント後はイベントリスナーが削除される", async () => {
    const el = document.createElement("button");
    document.body.appendChild(el);
    const handler = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useEvent(el, "click", handler);
      },
    })(el);

    await unmount([el]);
    el.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("window の resize イベントを購読でき、unmount 後は発火しない", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const handler = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useEvent(window, "resize", handler);
      },
    })(el);

    window.dispatchEvent(new Event("resize"));
    expect(handler).toHaveBeenCalledOnce();

    await unmount([el]);
    window.dispatchEvent(new Event("resize"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("document のイベントを購読できる", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const handler = vi.fn();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useEvent(document, "keydown", handler);
      },
    })(el);

    document.dispatchEvent(new KeyboardEvent("keydown"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("要素への CustomEvent を購読でき、detail を受け取れる", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const handler = vi.fn();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useEvent(el, "my-custom-event", (ev) => {
          handler((ev as CustomEvent).detail);
        });
      },
    })(el);

    el.dispatchEvent(new CustomEvent("my-custom-event", { detail: { foo: "bar" } }));
    expect(handler).toHaveBeenCalledWith({ foo: "bar" });
  });
});
