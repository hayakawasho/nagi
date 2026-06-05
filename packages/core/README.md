**English** | [日本語](./README.ja.md)

# nagi

**Lightweight lifecycle hooks and reactivity for existing HTML.**

[![npm](https://img.shields.io/npm/v/@usenagi/core)](https://www.npmjs.com/package/@usenagi/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@usenagi/core)](https://bundlephobia.com/package/@usenagi/core)
[![license](https://img.shields.io/npm/l/@usenagi/core)](./LICENSE)

---

## 30-second example

```ts
import { create, useDeferredUnmount, useUnmount } from "@usenagi/core";
import gsap from "gsap";

const app = create();

app.component({
  name: "modal",
  setup(el) {
    gsap.from(el, { opacity: 0, y: 20, duration: 0.4 });

    useDeferredUnmount(async () => {
      await gsap.to(el, { opacity: 0, y: -20, duration: 0.3 });
    });

    useUnmount(() => el.remove());
  },
})(document.querySelector(".modal")!);
```

Enter animation on mount, exit animation before unmount, cleanup on unmount — all in one `setup()`.

---

## Why nagi?

**Add lifecycle to existing HTML**

Add `setup()`, lifecycle hooks, and reactivity to WordPress, CMS, Webflow, static sites, etc. — no virtual DOM, no templates.

**Clean up after yourself**

Initialize GSAP, Lenis, IntersectionObserver in `setup()`. Clean up with `useUnmount()`. Run exit animations before removal with `useDeferredUnmount()`.

**Bring your own mounter**

`[data-component]` scanning, manifests, lazy imports, MutationObserver — implement your own mounting strategy.

---

## Quick start

```bash
npm i @usenagi/core
```

### First component

```ts
import { create, defineComponent, propTypes, signal, useWatch, useDomRef } from "@usenagi/core";

const Greeting = defineComponent({
  name: "greeting",
  props: propTypes<{ name: string }>(),
  setup(el, props) {
    const { refs } = useDomRef<{ message: HTMLParagraphElement }>();
    const text = signal(props.name ?? "world");

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
import { schedulerAddon } from "@usenagi/core/addons/scheduler";
import { visible, idle } from "@usenagi/core/addons/cue";

const app = create().install(schedulerAddon());

// mount when the element enters the viewport
app.component(HeavyWidget, { when: visible() })(el);

// mount during browser idle time
app.component(Analytics, { when: idle() })(el);
```

With `schedulerAddon()`, `when` is a condition to wait for before `setup()`, and `priority` determines the execution timing of the mount task that includes `setup()`.

### BYO mounter recipe

An example of automatic mounting by combining `[data-component]` scanning, manifests, and cues.
→ [examples/recipes/byo-mounter](../../examples/recipes/byo-mounter/main.ts)

---

## API

### Component Definition

| API                    | Description                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| `defineComponent(opts)` | Type-safe helper to define a `ComponentSetup` object                       |
| `propTypes<T>()`       | Type-only marker for declaring component props shape (zero runtime cost)    |

### Reactivity

| API                    | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `signal(value)`        | Creates a reactive value container (`.value`)                     |
| `readonly(signal)`     | Read-only wrapper around a writable `signal`                      |
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

| API                        | Description                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `useMount(fn)`             | Runs once after the component mounts                                        |
| `useUnmount(fn)`           | Runs on unmount; use for cleanup                                            |
| `useDeferredUnmount(fn)`   | Async callback that runs before unmount; use for exit animations            |

```ts
import gsap from 'gsap';

setup(el) {
  const tween = gsap.from(el, { opacity: 0, duration: 0.4 });
  useUnmount(() => tween.kill());
}
```

When a parent calls `removeChild`, it executes in the order of `useDeferredUnmount` followed by `useUnmount`. This allows you to encapsulate the flow within the component, such as waiting for an exit animation to complete before removing event listeners or the DOM.

```ts
setup(el) {
  useDeferredUnmount(async () => {
    el.classList.remove("is-open");
    await waitForTransition(el);
  });

  useUnmount(() => el.remove());
}
```

→ [examples/deferred-unmount](../../examples/deferred-unmount/main.ts)

### DOM helpers

Use **`setup(el)`** for the root element and **`useDomRef()`** for `[data-ref]` descendants.

| API                            | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `useDomRef<T>()`               | Typed access to `[data-ref]` elements                    |
| `useEvent(el, event, handler)` | Adds an event listener; automatically removed on unmount |
| `useSlot()`                    | Mounts child components; tied to the parent's unmount    |

### Parent / child

You can mount child components with `useSlot()`. You can pass values from parent to child via `props` or `createContext` / `withContext`. From the child context returned by `addChild()`, you can also reference the return value of the child's `setup()`.

→ [examples/parent-child](../../examples/parent-child/main.ts)

### Observers

| API                               | Description                                                         |
| --------------------------------- | ------------------------------------------------------------------- |
| `useIntersectionWatch(cb, opts?)` | IntersectionObserver wrapper; automatically disconnected on unmount |
| `useMediaQuery(query, cb)` | Runs `callback` when the query matches; returns `matchesQuery` as `ReadonlySignal<boolean>` |

### Addons

```ts
import { create, defineAddon } from "@usenagi/core";
import { schedulerAddon } from "@usenagi/core/addons/scheduler";

const app = create().install(schedulerAddon(), myAddon());
```

| API | Description |
| --- | --- |
| `defineAddon({ name, install(ctx) })` | Defines an addon (`ctx` is `AddonContext`) |
| `app.install(...addons)` | Registers one or more addons on the app |
| `ctx.addMountMiddleware` / `addUnmountMiddleware` / `addComponentMiddleware` | Add mount / unmount / ComponentSetup middleware |
| `ctx.installedAddons` | Addon names already installed on this app |

`addMountMiddleware`, `addUnmountMiddleware`, and `addComponentMiddleware` apply **outermost for addons installed later** (`install(a, b)` runs as `b → a → core`).

Deferred mounting requires `schedulerAddon()`. The same applies when using `when` or `priority`; these mount options are interpreted by the scheduler addon. Addon state (scheduler / pending) is created **per app `install`**, not per addon instance.

#### Scheduler + cue

```ts
import { schedulerAddon } from "@usenagi/core/addons/scheduler";
import { visible, idle, interaction, media } from "@usenagi/core/addons/cue";
```

| API | Description |
| --- | --- |
| `schedulerAddon(opts?)` | Addon for deferred mount |
| `visible(opts?)` | A Cue that resolves when the element enters the viewport |
| `idle(timeout?)` | A Cue that resolves via `requestIdleCallback` |
| `interaction(events?)` | A Cue that resolves on the first user interaction |
| `media(query)` | A Cue that resolves when the media query matches |

---

## Comparison

|                            | **nagi** | Alpine.js | Stimulus | petite-vue |
| -------------------------- | -------- | --------- | -------- | ---------- |
| Inline JS in HTML          | ✗        | ◯         | ✗        | ◯          |
| Composition-style setup    | ◯        | △         | ✗        | ◯          |
| BYO mounter                | ◯        | △         | △        | △          |
| Async mount cue            | ◯        | ✗         | ✗        | ✗          |
| Lifecycle cleanup          | ◯        | △         | ◯        | △          |
| computed (derived signals) | ◯        | ◯         | ✗        | ◯          |
| Core gzip                  | ~2.5 kB  | ~16 kB    | ~8 kB    | ~6 kB      |

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

| Example                                               | Description                                              |
| ----------------------------------------------------- | -------------------------------------------------------- |
| [basic-counter](../../examples/basic-counter/)            | Minimal `signal` + `useWatch` example                    |
| [computed](../../examples/computed/)                      | Derived value with `useComputed` (width × height = area) |
| [parent-child](../../examples/parent-child/)              | `createContext` + `withContext` + `useSlot`              |
| [deferred-unmount](../../examples/deferred-unmount/)          | Exit animation with `useDeferredUnmount`                  |
| [lenis-scroll-scene](../../examples/lenis-scroll-scene/)  | Scroll-progress animation with Lenis + `useComputed`     |
| [byo-mounter recipe](../../examples/recipes/byo-mounter/) | `[data-component]` scanning + manifest + cue             |

---

## License

MIT © [hayakawasho](https://github.com/hayakawasho)
