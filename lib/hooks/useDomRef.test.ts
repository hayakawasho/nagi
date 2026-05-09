import { afterEach, describe, expect, it } from "vitest";

import { create } from "../core/app";
import { defineComponent } from "../core/component";

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
  it("data-ref の要素を取得できる", () => {
    const el = makeEl('<span data-ref="btn"></span>');
    let result: HTMLElement | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ btn: HTMLElement }>();
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
        const { refs } = useDomRef<{ missing: HTMLElement | null }>();
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
        const { refs } = useDomRef<{ a: HTMLElement; b: HTMLElement }>();
        refA = refs.a;
        refB = refs.b;
      },
    })(el);
    expect(refA).toBeInstanceOf(HTMLElement);
    expect(refB).toBeInstanceOf(HTMLElement);
  });

  it("setup 外で呼ぶと例外を投げる", () => {
    expect(() => useDomRef()).toThrow();
  });

  it("addChild 後に子コンポーネント配下の ref を取得しない", () => {
    const el = makeEl(`
      <span data-ref="title"></span>
      <div data-ref="childRoot">
        <span data-ref="title"></span>
      </div>
    `);
    let parentTitle: HTMLElement | HTMLElement[] | null = null;

    const Child = defineComponent({
      name: "child",
      setup: () => {},
    });

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { refs } = useDomRef<{
          title: HTMLElement;
          childRoot: HTMLElement;
        }>();
        const { addChild } = useSlot();
        addChild(refs.childRoot, Child, {});
        parentTitle = refs.title;
      },
    })(el);

    expect(parentTitle).toBeInstanceOf(HTMLElement);
    expect(Array.isArray(parentTitle)).toBe(false);
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
        addChild(refs.childRoot, Child, {});
        afterAddChild = refs.title;
      },
    })(el);

    expect(beforeAddChild).toBe(afterAddChild);
  });

  it("refs.child を addChild に渡す典型パターンが動作する", () => {
    const el = makeEl('<div data-ref="slot"><p>child content</p></div>');
    let mounted = false;

    const Child = defineComponent({
      name: "child",
      setup: () => {
        mounted = true;
      },
    });

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        const { refs } = useDomRef<{ slot: HTMLElement }>();
        const { addChild } = useSlot();
        addChild(refs.slot, Child, {});
      },
    })(el);

    expect(mounted).toBe(true);
  });

  it("SVGElement を取得できる", () => {
    const el = makeEl('<svg><g data-ref="g"></g></svg>');
    let result: SVGElement | null = null;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<{ g: SVGElement }>();
        result = refs.g as SVGElement;
      },
    })(el);
    expect(result).toBeInstanceOf(SVGElement);
  });

  it("型に存在しないキーは null を返す", () => {
    const el = makeEl("");
    let result: unknown;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { refs } = useDomRef<Record<string, HTMLElement | null>>();
        result = (refs as unknown as Record<string, unknown>).nonexistent;
      },
    })(el);
    expect(result).toBeNull();
  });
});
