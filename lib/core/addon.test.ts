import { afterEach, describe, expect, it, vi } from "vitest";

import { defineAddon } from "./addon";
import { create } from "./app";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("defineAddon / install", () => {
  it("同名 addon の二重 install で throw", () => {
    const addon = defineAddon({ name: "dup", install: () => {} });
    const app = create();
    app.install(addon);
    expect(() => app.install(addon)).toThrow(/already installed/);
  });

  it("install に複数 addon を渡せる", () => {
    const wrapFn = vi.fn();
    const addon = defineAddon({
      name: "wrap-test",
      install(ctx) {
        ctx.addComponentMiddleware((comp) => ({
          name: comp.name,
          setup(el, props) {
            wrapFn();
            return comp.setup(el, props);
          },
        }));
      },
    });

    const el = makeEl();
    create()
      .install(addon)
      .component({ name: "t", setup: () => {} })(el);
    expect(wrapFn).toHaveBeenCalledOnce();
  });

  it("addMountMiddleware は後から install した addon ほど外側に適用される", () => {
    const order: string[] = [];
    const a = defineAddon({
      name: "a",
      install(ctx) {
        ctx.addMountMiddleware((mount) => (el, props) => {
          order.push("a");
          return mount(el, props);
        });
      },
    });
    const b = defineAddon({
      name: "b",
      install(ctx) {
        ctx.addMountMiddleware((mount) => (el, props) => {
          order.push("b");
          return mount(el, props);
        });
      },
    });

    const el = makeEl();
    create()
      .install(a, b)
      .component({ name: "t", setup: () => {} })(el);
    expect(order).toEqual(["b", "a"]);
  });
});
