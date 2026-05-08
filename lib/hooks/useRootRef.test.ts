import { afterEach, describe, expect, it } from "vitest";

import { create } from "../core/core";
import { useRootRef } from "./useRootRef";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useRootRef", () => {
  it("コンポーネントのルート要素を返す", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    let root: Element | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        root = useRootRef();
      },
    })(el);
    expect(root).toBe(el);
  });

  it("ジェネリクスで型を指定できる", () => {
    const el = document.createElement("button");
    document.body.appendChild(el);
    let root: HTMLButtonElement | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        root = useRootRef<HTMLButtonElement>();
      },
    })(el);
    expect(root).toBe(el);
  });

  it("setup 外で呼ぶと例外を投げる", () => {
    expect(() => useRootRef()).toThrow();
  });
});
