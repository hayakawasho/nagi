import { create, signal, useComputed, useMount, useWatch } from "../../lib/main";
import { useDomRef } from "../../lib/hooks/useDomRef";

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

    refs.width.addEventListener("input", (e) => {
      width.value = Number((e.target as HTMLInputElement).value);
    });

    refs.height.addEventListener("input", (e) => {
      height.value = Number((e.target as HTMLInputElement).value);
    });
  },
})(document.getElementById("root") as HTMLElement);
