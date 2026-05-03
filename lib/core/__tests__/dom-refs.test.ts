import { afterEach, describe, expect, it } from "vitest";

import { domRefs } from "../internal/dom-refs";

function createScope(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("domRefs", () => {
  it("data-ref 属性の要素を1つ取得できる", () => {
    const scope = createScope('<span data-ref="foo"></span>');
    const result = domRefs(new Set(["foo"]), scope);
    expect(result.foo).toBeInstanceOf(HTMLElement);
  });

  it("存在しない ref は null を返す", () => {
    const scope = createScope("<div></div>");
    const result = domRefs(new Set(["missing"]), scope);
    expect(result.missing).toBeNull();
  });

  it("同じ data-ref が複数ある場合は配列を返す", () => {
    const scope = createScope(
      '<span data-ref="item"></span><span data-ref="item"></span>',
    );
    const result = domRefs(new Set(["item"]), scope);
    expect(Array.isArray(result.item)).toBe(true);
    expect(result.item).toHaveLength(2);
  });

  it("スコープ外の要素は取得しない", () => {
    const scope = createScope('<span data-ref="inner"></span>');
    const outside = document.createElement("span");
    outside.setAttribute("data-ref", "inner");
    document.body.appendChild(outside);

    const result = domRefs(new Set(["inner"]), scope);
    // scope 内の1つだけを返すはずだが、scope 外は別の appendChild
    // scope.querySelectorAll はスコープ内のみ
    expect(result.inner).toBeInstanceOf(HTMLElement);
    expect(Array.isArray(result.inner)).toBe(false);
  });

  it("複数の ref キーをまとめて取得できる", () => {
    const scope = createScope('<a data-ref="a"></a><b data-ref="b"></b>');
    const result = domRefs(new Set(["a", "b"]), scope);
    expect(result.a).toBeInstanceOf(HTMLElement);
    expect(result.b).toBeInstanceOf(HTMLElement);
  });
});
