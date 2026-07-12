import {
  create,
  defineComponent,
  useDomRef,
  useUnmount,
} from "../../packages/core/lib/main";
import { signal } from "../../packages/addons/signals";

const Counter = defineComponent({
  name: "counter",
  setup() {
    const { refs } = useDomRef<{
      increment: HTMLButtonElement;
      decrement: HTMLButtonElement;
      count: HTMLSpanElement;
    }>();
    const n = signal(0);

    const sync = () => {
      refs.count.textContent = String(n.value);
    };

    sync();

    const inc = () => {
      n.value += 1;
      sync();
    };
    const dec = () => {
      n.value -= 1;
      sync();
    };

    refs.increment.addEventListener("click", inc);
    refs.decrement.addEventListener("click", dec);

    useUnmount(() => {
      refs.increment.removeEventListener("click", inc);
      refs.decrement.removeEventListener("click", dec);
    });
  },
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("counter-root");
  if (!root) return;
  const app = create();
  app.component(Counter)(root);
});
