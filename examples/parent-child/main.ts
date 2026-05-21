import {
  create,
  createContext,
  defineComponent,
  propTypes,
  readonly,
  signal,
  useDomRef,
  useEvent,
  useSlot,
  useWatch,
  withContext,
} from "../../lib/main";
import type { ReadonlySignal } from "../../lib/main";

type DisclosureContext = {
  isOpen: ReadonlySignal<boolean>;
  toggle: () => void;
};

const [DisclosureProvider, useDisclosureContext] =
  createContext<DisclosureContext>();

const Trigger = defineComponent({
  name: "trigger",
  props: propTypes<{ label: string }>(),
  setup(el: HTMLButtonElement, props) {
    const { isOpen, toggle } = useDisclosureContext();

    const label = props.label;
    el.textContent = label;
    useEvent(el, "click", toggle);

    useWatch(isOpen, (open) => {
      el.setAttribute("aria-expanded", String(open));
    });

    return {
      focus() {
        el.focus();
      },
    };
  },
});

const Disclosure = defineComponent({
  name: "disclosure",
  setup() {
    const { refs } = useDomRef<{
      trigger: HTMLButtonElement;
      panel: HTMLDivElement;
    }>();
    const { addChild } = useSlot();

    const isOpen = signal(false);

    const toggle = () => {
      isOpen.value = !isOpen.value;
    };

    const [trigger] = addChild(
      refs.trigger,
      withContext(DisclosureProvider, {
        isOpen: readonly(isOpen),
        toggle,
      })(Trigger),
      { label: "Toggle panel" },
    );

    useWatch(isOpen, (open) => {
      refs.panel.hidden = !open;

      if (!open) {
        trigger.current.focus();
      }
    });
  },
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("disclosure");
  if (!root) return;
  const app = create();
  app.component(Disclosure)(root);
});
