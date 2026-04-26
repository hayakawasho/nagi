import { afterEach, describe, expect, it } from "vitest";
import { create } from "../../core/core";
import { createContext } from "../createContext";
import { useSlot } from "../useSlot";

afterEach(() => {
  document.body.innerHTML = "";
});

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("createContext", () => {
  it("[provide, use] のタプルを返す", () => {
    const [provide, use] = createContext<string>();
    expect(typeof provide).toBe("function");
    expect(typeof use).toBe("function");
  });

  it("provide した値を子で use できる", () => {
    const [provide, use] = createContext<string>();
    const root = makeEl();
    const childEl = makeEl();

    let received: string | undefined;

    const childComp = {
      name: "child",
      setup: () => {
        received = use();
      },
    };

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        provide("hello");
        const { addChild } = useSlot();
        addChild(childEl, childComp, {});
      },
    })(root);

    expect(received).toBe("hello");
  });

  it("親チェーンを遡って provide を探す", () => {
    const [provide, use] = createContext<number>();
    const root = makeEl();
    const midEl = makeEl();
    const childEl = makeEl();

    let received: number | undefined;

    const grandChildComp = {
      name: "grandchild",
      setup: () => {
        received = use();
      },
    };

    const midComp = {
      name: "mid",
      setup: () => {
        // mid は provide しない
        const { addChild } = useSlot();
        addChild(childEl, grandChildComp, {});
      },
    };

    const { component } = create();
    component({
      name: "root",
      setup: () => {
        provide(42);
        const { addChild } = useSlot();
        addChild(midEl, midComp, {});
      },
    })(root);

    expect(received).toBe(42);
  });

  it("provider がなくデフォルト値がある場合はデフォルト値を返す", () => {
    const [, use] = createContext<string>("default");
    const root = makeEl();
    let received: string | undefined;

    const { component } = create();
    component({
      name: "test",
      setup: () => {
        // provide しない
        received = use();
      },
    })(root);

    expect(received).toBe("default");
  });

  it("provider もデフォルト値もない場合は例外を投げる", () => {
    const [, use] = createContext<string>();
    const root = makeEl();
    let error: Error | undefined;

    const { component } = create();
    component({
      name: "test",
      setup: () => {
        try {
          use();
        } catch (e) {
          error = e as Error;
        }
      },
    })(root);

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/no provider found/);
  });

  it("複数の独立したコンテキストは互いに干渉しない", () => {
    const [provideA, useA] = createContext<string>();
    const [provideB, useB] = createContext<number>();

    const root = makeEl();
    const childEl = makeEl();
    let a: string | undefined;
    let b: number | undefined;

    const childComp = {
      name: "child",
      setup: () => {
        a = useA();
        b = useB();
      },
    };

    const { component } = create();
    component({
      name: "parent",
      setup: () => {
        provideA("foo");
        provideB(99);
        const { addChild } = useSlot();
        addChild(childEl, childComp, {});
      },
    })(root);

    expect(a).toBe("foo");
    expect(b).toBe(99);
  });

  it("setup 外で provide を呼ぶと例外を投げる", () => {
    const [provide] = createContext<string>();
    expect(() => provide("test")).toThrow();
  });
});
