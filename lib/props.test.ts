import { describe, expect, it } from "vitest";

import { defineComponent } from "./core/component";
import { propTypes } from "./props";

describe("propTypes", () => {
  it("ランタイム値は undefined", () => {
    expect(propTypes<{ label: string }>()).toBeUndefined();
  });

  it("defineComponent の props から setup 内 props が推論される", () => {
    const comp = defineComponent({
      name: "with-props",
      props: propTypes<{ label: string }>(),
      setup(_el, props) {
        return { label: props.label };
      },
    });

    expect(comp.name).toBe("with-props");
  });
});
