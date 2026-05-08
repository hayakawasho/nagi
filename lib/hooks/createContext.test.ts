import { afterEach, describe, expect, it } from "vitest";

import { create } from "../core/core";
import { createContext, withContext } from "./createContext";
import { useSlot } from "./useSlot";

afterEach(() => {
  document.body.innerHTML = "";
});

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("createContext", () => {
  it("[Provider, use] のタプルを返す", () => {
    const [Provider, use] = createContext<string>();
    expect(typeof Provider).toBe("object");
    expect("_id" in Provider).toBe(true);
    expect(typeof use).toBe("function");
  });

  it("withContext で provide した値を子で use できる", () => {
    const [Provider, use] = createContext<string>();
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
    component(
      withContext(
        Provider,
        "hello",
      )({
        name: "parent",
        setup: () => {
          const { addChild } = useSlot();
          addChild(childEl, childComp, {});
        },
      }),
    )(root);

    expect(received).toBe("hello");
  });

  it("親チェーンを遡って provide を探す", () => {
    const [Provider, use] = createContext<number>();
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
        const { addChild } = useSlot();
        addChild(childEl, grandChildComp, {});
      },
    };

    const { component } = create();
    component(
      withContext(
        Provider,
        42,
      )({
        name: "root",
        setup: () => {
          const { addChild } = useSlot();
          addChild(midEl, midComp, {});
        },
      }),
    )(root);

    expect(received).toBe(42);
  });

  it("provider がない場合は例外を投げる", () => {
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
    const [ProviderA, useA] = createContext<string>();
    const [ProviderB, useB] = createContext<number>();

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
    component(
      withContext(
        ProviderA,
        "foo",
      )(
        withContext(
          ProviderB,
          99,
        )({
          name: "parent",
          setup: () => {
            const { addChild } = useSlot();
            addChild(childEl, childComp, {});
          },
        }),
      ),
    )(root);

    expect(a).toBe("foo");
    expect(b).toBe(99);
  });

  it("setup 外で use を呼ぶと例外を投げる", () => {
    const [, use] = createContext<string>();
    expect(() => use()).toThrow();
  });
});
