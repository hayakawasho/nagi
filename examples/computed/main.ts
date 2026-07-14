import { create, useMount, useEvent } from "../../packages/core/lib/main";
import { useDomRef } from "../../packages/core/lib/hooks/core/useDomRef";
import { signal, useComputed, useWatch } from "../../packages/addons/signals";

type Refs = {
  width: HTMLInputElement;
  height: HTMLInputElement;
  area: HTMLOutputElement;
  label: HTMLParagraphElement;
};

const { component } = create();

component({
  name: "root",
  setup() {
    const { refs } = useDomRef<Refs>();

    const width = signal(Number(refs.width.value));
    const height = signal(Number(refs.height.value));

    // 複数の signal に依存した派生値。width か height が変わると自動で再計算される
    const area = useComputed(() => width.value * height.value);
    const label = useComputed(() =>
      area.value > 100 ? "大きい面積です" : "小さい面積です",
    );

    useMount(() => {
      refs.area.textContent = `面積: ${area.value}`;
      refs.label.textContent = label.value;
    });

    useWatch(area, (v) => {
      refs.area.textContent = `面積: ${v}`;
    });

    useWatch(label, (v) => {
      refs.label.textContent = v;
    });

    useEvent(refs.width, "input", (e) => {
      width.value = Number((e.target as HTMLInputElement).value);
    });

    useEvent(refs.height, "input", (e) => {
      height.value = Number((e.target as HTMLInputElement).value);
    });
  },
})(document.getElementById("root") as HTMLElement);
