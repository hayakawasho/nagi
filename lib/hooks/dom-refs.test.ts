import { afterEach, describe, expect, it, vi } from "vitest";

import { domRefs } from "./dom-refs";

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
    const result = domRefs(scope, () => []);
    expect(result.foo).toBeInstanceOf(HTMLElement);
  });

  it("存在しない ref は null を返す", () => {
    const scope = createScope("<div></div>");
    const result = domRefs(scope, () => []);
    expect(result.missing).toBeNull();
  });

  it("同じ data-ref が複数ある場合は配列を返す", () => {
    const scope = createScope(
      '<span data-ref="item"></span><span data-ref="item"></span>',
    );
    const result = domRefs(scope, () => []);
    expect(Array.isArray(result.item)).toBe(true);
    expect(result.item).toHaveLength(2);
  });

  it("スコープ外の要素は取得しない", () => {
    const scope = createScope('<span data-ref="inner"></span>');
    const outside = document.createElement("span");
    outside.setAttribute("data-ref", "inner");
    document.body.appendChild(outside);

    const result = domRefs(scope, () => []);
    expect(result.inner).toBeInstanceOf(HTMLElement);
    expect(Array.isArray(result.inner)).toBe(false);
  });

  it("複数の ref キーをまとめて取得できる", () => {
    const scope = createScope('<a data-ref="a"></a><b data-ref="b"></b>');
    const result = domRefs(scope, () => []);
    expect(result.a).toBeInstanceOf(HTMLElement);
    expect(result.b).toBeInstanceOf(HTMLElement);
  });

  it("境界要素の strict descendant は除外される", () => {
    const scope = createScope(`
      <span data-ref="title"></span>
      <div data-ref="child">
        <span data-ref="title"></span>
      </div>
    `);
    const boundary = scope.querySelector<HTMLElement>('[data-ref="child"]')!;
    const result = domRefs(scope, () => [boundary]);

    expect(result.title).toBeInstanceOf(HTMLElement);
    expect(Array.isArray(result.title)).toBe(false);
  });

  it("境界要素 itself は取得できる", () => {
    const scope = createScope('<div data-ref="child"><span></span></div>');
    const boundary = scope.querySelector<HTMLElement>('[data-ref="child"]')!;
    const result = domRefs(scope, () => [boundary]);

    expect(result.child).toBe(boundary);
  });

  it("ネストした境界（孫コンポーネント）も除外される", () => {
    const scope = createScope(`
      <span data-ref="label"></span>
      <div data-ref="child">
        <span data-ref="label"></span>
        <div data-ref="grandchild">
          <span data-ref="label"></span>
        </div>
      </div>
    `);
    const boundary = scope.querySelector<HTMLElement>('[data-ref="child"]')!;
    const result = domRefs(scope, () => [boundary]);

    expect(result.label).toBeInstanceOf(HTMLElement);
    expect(Array.isArray(result.label)).toBe(false);
  });

  it("初回アクセス後に DOM を変更しても結果はキャッシュされる", () => {
    const scope = createScope('<span data-ref="item"></span>');
    const result = domRefs(scope, () => []);

    const first = result.item;
    scope.querySelector('[data-ref="item"]')!.remove();
    const second = result.item;

    expect(first).toBe(second);
  });

  it("getBoundaries は初回アクセス時に呼ばれ、2回目以降は呼ばれない", () => {
    const scope = createScope('<span data-ref="x"></span>');
    const getBoundaries = vi.fn(() => [] as HTMLElement[]);
    const result = domRefs(scope, getBoundaries);

    result.x;
    result.x;

    expect(getBoundaries).toHaveBeenCalledTimes(1);
  });

  it("Symbol プロパティは undefined を返す", () => {
    const scope = createScope("");
    const result = domRefs(scope, () => []);
    expect((result as unknown as Record<symbol, unknown>)[Symbol.iterator]).toBeUndefined();
  });

  it("then プロパティは undefined を返す（Promise 誤検知防止）", () => {
    const scope = createScope("");
    const result = domRefs(scope, () => []);
    expect((result as unknown as Record<string, unknown>).then).toBeUndefined();
  });

  it("set は拒否される（immutable）", () => {
    const scope = createScope('<span data-ref="x"></span>');
    const result = domRefs(scope, () => []);
    expect(() => {
      (result as Record<string, unknown>).x = null;
    }).toThrow();
  });
});
