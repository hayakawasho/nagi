import { afterEach, describe, expect, it, vi } from "vitest";

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  el.id = "app";
  document.body.appendChild(el);
  return el;
}

async function loadDebugModules() {
  vi.resetModules();
  const [core, debug] = await Promise.all([
    import("@usenagi/core"),
    import("@usenagi/core/addons/debug"),
  ]);

  return { ...core, ...debug };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("debugAddon", () => {
  it("devmode reporter の console.error を1回だけ呼ぶ", async () => {
    const { create, debugAddon, useMount } = await loadDebugModules();
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("mount");

    create()
      .install(debugAddon())
      .component({
        name: "App",
        setup: () => {
          useMount(() => {
            throw error;
          });
        },
      })(makeEl());

    expect(errorLog).toHaveBeenCalledOnce();
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining("[nagi:debug] error:lifecycle:mount"),
      error,
    );
  });

});
