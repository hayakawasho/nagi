declare const Lenis: any;

import {
  create,
  defineComponent,
  signal,
  useComputed,
  useDomRef,
  useMount,
  useWatch,
} from "../../lib/main";

const ScrollScene = defineComponent({
  name: "scrollScene",
  setup(el) {
    const { refs } = useDomRef<{
      bar: HTMLDivElement;
      label: HTMLSpanElement;
    }>();

    const scrollY = signal(0);

    const progress = useComputed(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return 0;
      return Math.min(1, Math.max(0, scrollY.value / max));
    });

    const labelText = useComputed(() => `${Math.round(progress.value * 100)}%`);

    useWatch(progress, () => {
      refs.bar.style.width = `${progress.value * 100}%`;
    });

    useWatch(labelText, () => {
      refs.label.textContent = labelText.value;
    });

    useMount(() => {
      const lenis = new Lenis({
        autoRaf: true,
      });

      const onScroll = () => {
        scrollY.value = window.scrollY;
      };

      lenis.on("scroll", onScroll);
      onScroll();

      return () => {
        lenis.off("scroll", onScroll);
        lenis.destroy();
      };
    });
  },
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("scroll-ui");
  if (!root) return;
  const app = create();
  app.component(ScrollScene)(root);
});
