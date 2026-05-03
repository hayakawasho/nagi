import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "../../core/core";
import { useEvent } from "../useEvent";

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

  it("アンマウント後はイベントリスナーが削除される", () => {
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

    unmount([el]);
    el.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("対象要素はコンポーネントのルートと異なる要素でも可", () => {
    const root = document.createElement("div");
    const btn = document.createElement("button");
    root.appendChild(btn);
    document.body.appendChild(root);

    const handler = vi.fn();
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useEvent(btn, "click", handler);
      },
    })(root);

    btn.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledOnce();
  });
});
