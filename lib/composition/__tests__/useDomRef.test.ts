import { afterEach, describe, expect, it } from "vitest";

import { create } from "../../core/core";
import { useDomRef } from "../useDomRef";

function makeEl(html = ""): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useDomRef", () => {
  it("data-ref の要素を取得できる", () => {
    const el = makeEl('<span data-ref="btn"></span>');
    let result: HTMLElement | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ btn: HTMLElement }>("btn");
        result = refs.btn;
      },
    })(el);
    expect(result).toBeInstanceOf(HTMLElement);
  });

  it("存在しない ref は null", () => {
    const el = makeEl();
    let result: HTMLElement | null | undefined;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ missing: HTMLElement | null }>("missing");
        result = refs.missing;
      },
    })(el);
    expect(result).toBeNull();
  });

  it("複数の ref キーをまとめて取得できる", () => {
    const el = makeEl('<a data-ref="a"></a><b data-ref="b"></b>');
    let refA: Element | null = null;
    let refB: Element | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ a: HTMLElement; b: HTMLElement }>(
          "a",
          "b",
        );
        refA = refs.a;
        refB = refs.b;
      },
    })(el);
    expect(refA).toBeInstanceOf(HTMLElement);
    expect(refB).toBeInstanceOf(HTMLElement);
  });

  it("setup 外で呼ぶと例外を投げる", () => {
    expect(() => useDomRef("key")).toThrow();
  });
});
