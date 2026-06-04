import { afterEach, describe, expect, it } from "vitest";

import { create } from "../../core/app";
import { defineComponent } from "../../core/component";

import { useDomRef } from "./useDomRef";
import { useSlot } from "./useSlot";

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
  it("複数の ref キーをまとめて取得できる", () => {
    const el = makeEl('<a data-ref="a"></a><b data-ref="b"></b>');
    let refA: Element | null = null;
    let refB: Element | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ a: HTMLElement; b: HTMLElement }>();
        refA = refs.a;
        refB = refs.b;
      },
    })(el);
    expect(refA).toBeInstanceOf(HTMLElement);
    expect(refB).toBeInstanceOf(HTMLElement);
  });

  it("存在しない ref は null", () => {
    const el = makeEl();
    let result: HTMLElement | null | undefined;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ missing: HTMLElement | null }>();
        result = refs.missing;
      },
    })(el);
    expect(result).toBeNull();
  });

  it("addChild 前にキャッシュされた refs は addChild 後も変わらない（stale）", () => {
    const el = makeEl(`
      <span data-ref="title"></span>
      <div data-ref="childRoot">
        <span data-ref="title"></span>
      </div>
    `);
    let beforeAddChild: HTMLElement | HTMLElement[] | null = null;
    let afterAddChild: HTMLElement | HTMLElement[] | null = null;

    const Child = defineComponent({
      name: "child",
      setup: () => {},
    });

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { refs } = useDomRef<{
          title: HTMLElement | HTMLElement[];
          childRoot: HTMLElement;
        }>();
        const { addChild } = useSlot();
        beforeAddChild = refs.title;
        addChild(refs.childRoot, Child);
        afterAddChild = refs.title;
      },
    })(el);

    expect(beforeAddChild).toBe(afterAddChild);
  });

  it("同じ data-ref が複数ある場合は配列を返す", () => {
    const el = makeEl(
      '<span data-ref="item"></span><span data-ref="item"></span>',
    );
    let items: HTMLElement[] | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ item: HTMLElement[] }>();
        items = refs.item;
      },
    })(el);
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(2);
  });

  it("スコープ外の要素は取得しない", () => {
    const el = makeEl('<span data-ref="inner"></span>');
    const outside = document.createElement("span");
    outside.setAttribute("data-ref", "inner");
    document.body.appendChild(outside);

    let result: HTMLElement | HTMLElement[] | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ inner: HTMLElement }>();
        result = refs.inner;
      },
    })(el);

    expect(result).toBeInstanceOf(HTMLElement);
    expect(Array.isArray(result)).toBe(false);
  });

  it("初回アクセス後に DOM を変更しても結果はキャッシュされる", () => {
    const el = makeEl('<span data-ref="item"></span>');
    let first: HTMLElement | HTMLElement[] | null = null;
    let second: HTMLElement | HTMLElement[] | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ item: HTMLElement }>();
        first = refs.item;
        el.querySelector('[data-ref="item"]')!.remove();
        second = refs.item;
      },
    })(el);

    expect(first).toBe(second);
  });
});
