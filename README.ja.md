[English](./README.md) | **日本語**

# nagi

**Composition-style ergonomics for vanilla DOM. Bring your own mounter.**

[![npm](https://img.shields.io/npm/v/@usenagi/core)](https://www.npmjs.com/package/@usenagi/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@usenagi/core)](https://bundlephobia.com/package/@usenagi/core)
[![license](https://img.shields.io/npm/l/@usenagi/core)](./LICENSE)

---

## Why nagi?

**既存 HTML に小さく足せる**
WordPress、CMS、Webflow、静的サイトなどに、仮想 DOM やテンプレートを持ち込まず `setup()` / lifecycle / reactivity を追加できる。

**アニメーションと相性が良い**
GSAP、Lenis、IntersectionObserver などを `setup()` で初期化し、`useUnmount()` でクリーンアップできる。

**マウント戦略を縛らない**
`[data-component]` スキャン、manifest、lazy import、MutationObserver などは利用側で自由に組める。

---

## 30-second example

```ts
// counter.ts
import { create, ref, useWatch, useDomRef } from "@usenagi/core";

const { component } = create();

component({
  name: "counter",
  setup() {
    const { refs } = useDomRef<{
      count: HTMLSpanElement;
      btn: HTMLButtonElement;
    }>();

    const n = ref(0);
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
import { create, defineComponent, ref, useWatch, useDomRef } from "@usenagi/core";

const Greeting = defineComponent({
  name: "greeting",
  setup(el, props) {
    const { refs } = useDomRef<{ message: HTMLParagraphElement }>();
    const text = ref((props.name as string) ?? "world");

    useWatch(text, (v) => {
      refs.message.textContent = `Hello, ${v}!`;
    });
    refs.message.textContent = `Hello, ${text.value}!`;
  },
});

create().component(Greeting)(document.querySelector("#app")!);
```

### Scheduler + deferred mount

遅延マウントが必要なら scheduler / cue addons を追加する。

```ts
import { create } from "@usenagi/core";
import { createScheduler } from "@usenagi/core/addons/scheduler";
import { visible, idle } from "@usenagi/core/addons/cue";

const app = create({ scheduler: createScheduler() });

// Intersection で visible になってからマウント
app.component(HeavyWidget, { when: visible() })(el);

// requestIdleCallback でマウント
app.component(Analytics, { when: idle() })(el);
```

`when` は `setup()` の前に待機する条件、`priority` は `setup()` を含む mount task の実行タイミングを決める。

### BYO mounter recipe

`[data-component]` スキャン、manifest、cue を組み合わせて自動マウントする一例。
→ [examples/recipes/byo-mounter](./examples/recipes/byo-mounter/main.ts)

---

## API

### Reactivity

| API                 | 説明                                         |
| ------------------- | -------------------------------------------- |
| `ref(value)`        | リアクティブな参照を作成                     |
| `readonly(ref)`     | 読み取り専用ラッパー                         |
| `computed(fn)`      | 依存する `ref` を自動追跡する派生値          |
| `useWatch(ref, cb)` | 値変更時にコールバック。unmount 時に自動解除 |

```ts
const width = ref(10);
const height = ref(5);
const area = computed(() => width.value * height.value); // 自動再計算

useWatch(area, (v) => {
  output.textContent = String(v);
});
```

### Lifecycle

| API              | 説明                                       |
| ---------------- | ------------------------------------------ |
| `useMount(fn)`   | マウント完了後に1回実行                    |
| `useUnmount(fn)` | アンマウント時に実行。クリーンアップに使う |

```ts
import gsap from 'gsap';

setup(el) {
  const tween = gsap.from(el, { opacity: 0, duration: 0.4 });
  useUnmount(() => tween.kill());
}
```

### DOM helpers

| API                            | 説明                                            |
| ------------------------------ | ----------------------------------------------- |
| `useDomRef<T>()`               | `[data-ref]` 要素を型付きで取得                 |
| `useRootRef()`                 | ルート要素を取得                                |
| `useEvent(el, event, handler)` | イベントリスナーを登録。unmount 時に自動除去    |
| `useSlot()`                    | 子コンポーネントをマウント。親の unmount に連動 |

### Parent / child

`useSlot()` で子コンポーネントをマウントできる。親から子へは `props` または `createContext` / `withContext` で値を渡せる。`addChild()` が返す child context から、子の `setup()` 返り値も参照できる。

→ [examples/parent-child](./examples/parent-child/main.ts)

### Observers

| API                               | 説明                                                |
| --------------------------------- | --------------------------------------------------- |
| `useIntersectionWatch(cb, opts?)` | IntersectionObserver。unmount 時に自動解除          |
| `useMediaQuery(query)`            | `matchMedia` の結果を `ReadonlyRef<boolean>` で返す |

### Addons

```ts
import { createScheduler } from "@usenagi/core/addons/scheduler";
import { visible, idle, interaction, media } from "@usenagi/core/addons/cue";
```

| API                      | 説明                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `createScheduler(opts?)` | `scheduler.schedule(task, { priority, signal })` を実装した Scheduler を返す |
| `visible(opts?)`         | 要素が viewport に入ったら解決する Cue                                       |
| `idle(timeout?)`         | `requestIdleCallback` で解決する Cue                                         |
| `interaction(events?)`   | 最初のユーザー操作で解決する Cue                                             |
| `media(query)`           | media query が一致したら解決する Cue                                         |

---

## Comparison

|                         | **nagi**    | Alpine.js | Stimulus | petite-vue |
| ----------------------- | ----------- | --------- | -------- | ---------- |
| Inline JS in HTML       | ✗           | ◯         | ✗        | ◯          |
| Composition-style setup | ◯           | △         | ✗        | ◯          |
| BYO mounter             | ◯           | △         | △        | △          |
| Async mount cue         | ◯           | ✗         | ✗        | ✗          |
| Lifecycle cleanup       | ◯           | △         | ◯        | △          |
| `computed`              | ◯           | ◯         | ✗        | ◯          |
| Core gzip               | ~2.6-2.9 kB | ~16 kB    | ~8 kB    | ~6 kB      |

◯ = built-in、△ = userland / convention で対応可能、✗ = primary feature ではない。

- **vs Alpine / petite-vue**: HTML に式を書かず、ロジックを `.ts` に寄せる。
- **vs Stimulus**: Controller 規約なし。mounter は利用側で自由に組める。
- **vs React / Vue**: 宣言的 UI フレームワークではなく、既存 DOM に lifecycle を足す layer。

---

## When to use / When not to

**向いているケース**:

- React/Vue ほどのランタイムを持ち込みにくいプロジェクト（CMS、Webflow、WordPress 等）
- GSAP/Lenis を多用する、アニメーション主体のサイト
- ページの一部だけに interactive な UI を追加したい
- Composition-style な `setup()` / lifecycle / reactivity で書きたいが、仮想 DOM は不要

**向いていないケース**:

- リスト描画や条件分岐を HTML テンプレートで書きたい（`v-for`, `v-if` 相当は持たない）
- 深いオブジェクトのリアクティビティが必要（`reactive({})` は提供しない）
- SSR/hydration が必要
- アプリ全体の状態管理、ルーティング、宣言的な view rendering をまとめて任せたい

---

## Examples

| Example                                               | 説明                                         |
| ----------------------------------------------------- | -------------------------------------------- |
| [basic-counter](./examples/basic-counter/)            | `ref` + `useWatch` の最小例                  |
| [computed](./examples/computed/)                      | `computed` で派生値 (width × height = area)  |
| [parent-child](./examples/parent-child/)              | `createContext` + `withContext` + `useSlot`  |
| [lenis-scroll-scene](./examples/lenis-scroll-scene/)  | Lenis + `computed` でスクロール進捗連動      |
| [byo-mounter recipe](./examples/recipes/byo-mounter/) | `[data-component]` スキャン + manifest + cue |

---

## License

MIT © [hayakawasho](https://github.com/hayakawasho)
