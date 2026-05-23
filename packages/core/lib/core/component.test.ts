import { afterEach, describe, expect, it, vi } from "vitest";

import { create } from "./app";
import { getCurrentComponent } from "./runtime";

import type { ComponentContextImpl } from "./_internal/component";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("runtime", () => {
  it("setup 外で hook を呼ぶと例外を投げる", () => {
    expect(() => getCurrentComponent("testHook")).toThrow();
  });
});

describe("addChild ロールバック", () => {
  it("onMount が失敗した場合、child.parent が null にリセットされる", () => {
    const root = makeEl();
    const { component } = create();
    let parentCtx: ComponentContextImpl | undefined;

    component({
      name: "Parent",
      setup: () => {
        parentCtx = getCurrentComponent("test");
      },
    })(root);

    const throwingChild = {
      parent: null as ComponentContextImpl | null,
      onMount: () => {
        throw new Error("onMount failed");
      },
      onUnmount: vi.fn(),
    } as unknown as ComponentContextImpl;

    expect(() => parentCtx!.addChild(throwingChild)).toThrow();
    expect(throwingChild.parent).toBeNull();
  });

  it("onMount が失敗した場合、parent の onUnmount で child の onUnmount は呼ばれない", () => {
    const root = makeEl();
    const { component, unmount } = create();
    let parentCtx: ComponentContextImpl | undefined;

    component({
      name: "Parent",
      setup: () => {
        parentCtx = getCurrentComponent("test");
      },
    })(root);

    const childUnmount = vi.fn();
    const throwingChild = {
      parent: null as ComponentContextImpl | null,
      onMount: () => {
        throw new Error("onMount failed");
      },
      onUnmount: childUnmount,
    } as unknown as ComponentContextImpl;

    expect(() => parentCtx!.addChild(throwingChild)).toThrow();
    unmount([root]);
    expect(childUnmount).not.toHaveBeenCalled();
  });
});
