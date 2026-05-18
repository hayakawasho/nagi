import {
	create,
	createContext,
	defineComponent,
	readonly,
	ref,
	useDomRef,
	useEvent,
	useSlot,
	useWatch,
	withContext,
} from "../../lib/main";
import type { ReadonlyRef } from "../../lib/main";

type DisclosureContext = {
	isOpen: ReadonlyRef<boolean>;
	toggle: () => void;
};

const [DisclosureProvider, useDisclosureContext] = createContext<DisclosureContext>();

const Trigger = defineComponent({
	name: "trigger",
	setup(el: HTMLButtonElement) {
		const { isOpen, toggle } = useDisclosureContext();

		useEvent(el, "click", toggle);

		useWatch(isOpen, (open) => {
			el.setAttribute("aria-expanded", String(open));
		});
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

		const isOpen = ref(false);

		const toggle = () => {
			isOpen.value = !isOpen.value;
		};

		addChild(
			refs.trigger,
			withContext(DisclosureProvider, {
				isOpen: readonly(isOpen),
				toggle,
			})(Trigger),
			{},
		);

		useWatch(isOpen, (open) => {
			refs.panel.hidden = !open;
		});
	},
});

document.addEventListener("DOMContentLoaded", () => {
	const root = document.getElementById("disclosure");
	if (!root) return;
	const app = create();
	app.component(Disclosure)(root);
});
