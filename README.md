**English** | [日本語](./README.ja.md)

# nagi

**Composition-style ergonomics for vanilla DOM. Bring your own mounter.**

[![npm](https://img.shields.io/npm/v/@usenagi/core)](https://www.npmjs.com/package/@usenagi/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@usenagi/core)](https://bundlephobia.com/package/@usenagi/core)
[![license](https://img.shields.io/npm/l/@usenagi/core)](./LICENSE)

---

## Why nagi?

**Can be added in small parts to existing HTML**

You can add `setup()`, lifecycle, and reactivity to WordPress, CMS, Webflow, static sites, etc., without introducing a virtual DOM or templates.

**Compatible with animation**

You can initialize GSAP, Lenis, IntersectionObserver, etc., in `setup()` and clean them up with `useUnmount()`.

**Does not restrict mounting strategies**

You are free to implement `[data-component]` scanning, manifests, lazy imports, MutationObserver, and so on, on the consuming side.

---

## 30-second example

```ts
// counter.ts
import { create, signal, useWatch, useDomRef } from "@usenagi/core";

const { component } = create();

component({
  name: "counter",
  setup() {
    const { refs } = useDomRef<{
      count: HTMLSpanElement;
      btn: HTMLButtonElement;
    }>();

    const n = signal(0);
    useWatch(n, (v) => {
      refs.count.textContent = String(v);
    });
    refs.btn.addEventListener("click", () => {
      n.value++;
    });
  },
})(document.querySelector("#counter")!);
```

```html
<div id="counter">
  <span data-ref="count">0</span>
  <button data-ref="btn">+</button>
</div>
```

---

## Quick start

```bash
npm i @usenagi/core
```

### First component

```ts
import { create, defineComponent, signal, useWatch, useDomRef } from "@usenagi/core";

const Greeting = defineComponent({
  name: "greeting",
  setup(el, props) {
    const { refs } = useDomRef<{ message: HTMLParagraphElement }>();
    const text = signal((props.name as string) ?? "world");

    useWatch(text, (v) => {
      refs.message.textContent = `Hello, ${v}!`;
    });
    refs.message.textContent = `Hello, ${text.value}!`;
  },
});

create().component(Greeting)(document.querySelector("#app")!);
```

### Scheduler + deferred mount

If delayed mounting is required, add the scheduler / cue addons.

```ts
import { create } from "@usenagi/core";
import { createScheduler } from "@usenagi/core/addons/scheduler";
import { visible, idle } from "@usenagi/core/addons/cue";

const app = create({ scheduler: createScheduler() });

// mount when the element enters the viewport
app.component(HeavyWidget, { when: visible() })(el);

// mount during browser idle time
app.component(Analytics, { when: idle() })(el);
```

`when` is a condition to wait for before `setup()`, and `priority` determines the execution timing of the mount task that includes `setup()`.

### BYO mounter recipe

An example of automatic mounting by combining `[data-component]` scanning, manifests, and cues.
→ [examples/recipes/byo-mounter](./examples/recipes/byo-mounter/main.ts)

---

## API

### Reactivity

| API                    | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `signal(value)`        | Creates a reactive value container (`.value`)                    |
| `readonly(signal)`     | Read-only wrapper around a writable `signal`                    |
| `useComputed(fn)`      | Derived value that auto-tracks `signal` dependencies              |
| `useWatch(target, cb)` | Calls `cb` on value change; automatically unsubscribes on unmount |

```ts
const width = signal(10);
const height = signal(5);
const area = useComputed(() => width.value * height.value); // auto-recomputed

useWatch(area, (v) => {
  output.textContent = String(v);
});
```

### Lifecycle

| API              | Description                               |
| ---------------- | ----------------------------------------- |
| `useMount(fn)`   | Runs once after the component mounts      |
| `useUnmount(fn)` | Runs on unmount; use for cleanup          |

```ts
import gsap from 'gsap';

setup(el) {
  const tween = gsap.from(el, { opacity: 0, duration: 0.4 });
  useUnmount(() => tween.kill());
}
```

### DOM helpers

Use **`setup(el)`** for the root element and **`useDomRef()`** for `[data-ref]` descendants.

| API                            | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `useDomRef<T>()`               | Typed access to `[data-ref]` elements                        |
| `useEvent(el, event, handler)` | Adds an event listener; automatically removed on unmount     |
| `useSlot()`                    | Mounts child components; tied to the parent's unmount        |

### Parent / child

You can mount child components with `useSlot()`. You can pass values from parent to child via `props` or `createContext` / `withContext`. From the child context returned by `addChild()`, you can also reference the return value of the child's `setup()`.

→ [examples/parent-child](./examples/parent-child/main.ts)

### Observers

| API                               | Description                                                         |
| --------------------------------- | ------------------------------------------------------------------- |
| `useIntersectionWatch(cb, opts?)` | IntersectionObserver wrapper; automatically disconnected on unmount |
| `useMediaQuery(query)`            | Returns `matchMedia` result as a `ReadonlySignal<boolean>`           |

### Addons

```ts
import { createScheduler } from "@usenagi/core/addons/scheduler";
import { visible, idle, interaction, media } from "@usenagi/core/addons/cue";
```

| API                      | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| `createScheduler(opts?)` | Returns a Scheduler implementing `schedule(task, { priority, signal })` |
| `visible(opts?)`         | A Cue that resolves when the element enters the viewport              |
| `idle(timeout?)`         | A Cue that resolves via `requestIdleCallback`                         |
| `interaction(events?)`   | A Cue that resolves on the first user interaction                     |
| `media(query)`           | A Cue that resolves when the media query matches                      |

---

## Comparison

|                         | **nagi**    | Alpine.js | Stimulus | petite-vue |
| ----------------------- | ----------- | --------- | -------- | ---------- |
| Inline JS in HTML       | ✗           | ◯         | ✗        | ◯          |
| Composition-style setup | ◯           | △         | ✗        | ◯          |
| BYO mounter             | ◯           | △         | △        | △          |
| Async mount cue         | ◯           | ✗         | ✗        | ✗          |
| Lifecycle cleanup       | ◯           | △         | ◯        | △          |
| `useComputed` (derived signals) | ◯           | ◯         | ✗        | ◯          |
| Core gzip               | ~2.5 kB     | ~16 kB    | ~8 kB    | ~6 kB      |

(◯ = built-in, △ = handled via userland/convention, ✗ = not a primary feature)

- **vs Alpine / petite-vue**: Instead of writing logic expressions directly in HTML, you centralize your logic in `.ts` files.
- **vs Stimulus**: No controller conventions; you are free to implement your own mounting strategy.
- **vs React / Vue**: It is not a declarative UI framework, but rather a thin layer that adds lifecycle hooks to existing DOM.

---

## When to use / When not to

**Recommended Use Cases:**

- Projects where you cannot justify the runtime overhead of React or Vue (e.g., CMS, Webflow, WordPress).
- Animation-heavy sites that rely heavily on libraries like GSAP or Lenis.
- Scenarios where you only need to add interactive UI to specific parts of a page.
- When you want to use a composition-style approach with `setup()`, lifecycle hooks, and reactivity, but do not require a virtual DOM.

**Not Recommended For:**

- When you want to handle list rendering or conditional logic via HTML templates (it does not support equivalents to `v-for` or `v-if`).
- When you need deep reactivity for complex objects (it does not provide `reactive({})`).
- When SSR/hydration is required.
- When you want a full-featured framework to handle global state management, routing, and declarative view rendering.

---

## Examples

| Example                                               | Description                                            |
| ----------------------------------------------------- | ------------------------------------------------------ |
| [basic-counter](./examples/basic-counter/)            | Minimal `signal` + `useWatch` example                          |
| [computed](./examples/computed/)                     | Derived value with `useComputed` (width × height = area)        |
| [parent-child](./examples/parent-child/)              | `createContext` + `withContext` + `useSlot`            |
| [lenis-scroll-scene](./examples/lenis-scroll-scene/)  | Scroll-progress animation with Lenis + `useComputed`          |
| [byo-mounter recipe](./examples/recipes/byo-mounter/) | `[data-component]` scanning + manifest + cue           |

---

## License

MIT © [hayakawasho](https://github.com/hayakawasho)
