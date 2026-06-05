[English](./README.md) | **日本語**

# nagi

**既存 HTML にライフサイクルとリアクティビティを足す。**

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

    useDeferredUnmount(() =>
      gsap.to(el, { opacity: 0, y: -20, duration: 0.3 }),
    );

    useUnmount(() => el.remove());
  },
})(document.querySelector(".modal")!);
```

mount 時に登場アニメーション、unmount 前に退場アニメーション、unmount 時にクリーンアップ。すべて1つの `setup()` に収まる。

---

## Why nagi?

**既存 HTML にライフサイクルを足せる**

WordPress、CMS、Webflow、静的サイトなどに、仮想 DOM やテンプレートを持ち込まず `setup()` / lifecycle / reactivity を追加できる。

**後始末が確実にできる**

GSAP、Lenis、IntersectionObserver を `setup()` で初期化し、`useUnmount()` でクリーンアップ。`useDeferredUnmount()` で退場アニメーションを待ってから除去。

**マウント戦略を縛らない**

`[data-component]` スキャン、manifest、lazy import、MutationObserver — マウント戦略は利用側で自由に組み立てられる。

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

遅延マウントが必要な場合は、scheduler / cue addons を追加する。

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

`schedulerAddon()` を使うと、`when` は `setup()` の前に待機する条件、`priority` は `setup()` を含む mount task の実行タイミングを決める。

### BYO mounter recipe

`[data-component]` スキャン、manifest、cue を組み合わせた自動マウントの例。
→ [examples/recipes/byo-mounter](../../examples/recipes/byo-mounter/main.ts)

---

## API

### Component Definition

| API                    | 説明                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| `defineComponent(opts)` | 型安全な `ComponentSetup` 定義ヘルパー                          |
| `propTypes<T>()`       | コンポーネント props の型マーカー（ランタイムコストゼロ）         |

### Reactivity

| API                    | 説明                                                   |
| ---------------------- | ------------------------------------------------------ |
| `signal(value)`        | `.value` を持つリアクティブな値コンテナを作成する      |
| `readonly(signal)`     | 書き込み可能な `signal` の読み取り専用ラッパー         |
| `useComputed(fn)`      | `signal` の依存を自動追跡する派生値                    |
| `useWatch(target, cb)` | 値変更時に `cb` を呼ぶ。unmount 時に自動で購読解除する |

```ts
const width = signal(10);
const height = signal(5);
const area = useComputed(() => width.value * height.value); // auto-recomputed

useWatch(area, (v) => {
  output.textContent = String(v);
});
```

### Lifecycle

| API                        | 説明                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| `useMount(fn)`             | コンポーネントのマウント完了後に1回実行する                       |
| `useUnmount(fn)`           | unmount 時に実行する。クリーンアップに使う                        |
| `useDeferredUnmount(fn)`   | unmount の前に実行される非同期コールバック。退場アニメーションに使う |

```ts
import gsap from 'gsap';

setup(el) {
  const tween = gsap.from(el, { opacity: 0, duration: 0.4 });
  useUnmount(() => tween.kill());
}
```

親が `removeChild` を呼ぶと `useDeferredUnmount` → `useUnmount` の順で実行される。退場アニメーションの完了を待ってからイベントリスナーの解除や DOM の除去を行う、といったフローをコンポーネント内に閉じて書ける。

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

ルート要素には **`setup(el)`** を、**`[data-ref]`** の子要素には **`useDomRef()`** を使う。

| API                            | 説明                                                    |
| ------------------------------ | ------------------------------------------------------- |
| `useDomRef<T>()`               | `[data-ref]` 要素への型付きアクセス                     |
| `useEvent(el, event, handler)` | イベントリスナーを追加する。unmount 時に自動で除去する  |
| `useSlot()`                    | 子コンポーネントをマウントする。親の unmount に連動する |

### Parent / child

`useSlot()` で子コンポーネントをマウントできる。親から子へは `props` または `createContext` / `withContext` で値を渡せる。`addChild()` が返す child context から、子の `setup()` の返り値も参照できる。

→ [examples/parent-child](../../examples/parent-child/main.ts)

### Observers

| API                               | 説明                                                        |
| --------------------------------- | ----------------------------------------------------------- |
| `useIntersectionWatch(cb, opts?)` | IntersectionObserver のラッパー。unmount 時に自動で切断する |
| `useMediaQuery(query, cb)` | query 一致時に callback を実行し、`matchesQuery` を `ReadonlySignal<boolean>` で返す |

### Addons

```ts
import { create, defineAddon } from "@usenagi/core";
import { schedulerAddon } from "@usenagi/core/addons/scheduler";

const app = create().install(schedulerAddon(), myAddon());
```

| API | 説明 |
| --- | --- |
| `defineAddon({ name, install(ctx) })` | addon を定義する（`ctx` は `AddonContext`） |
| `app.install(...addons)` | app に addon を登録する（複数可） |
| `ctx.addMountMiddleware` / `addUnmountMiddleware` / `addComponentMiddleware` | mount / unmount / ComponentSetup の middleware を追加する |
| `ctx.installedAddons` | この app に install 済みの addon 名 |

`addMountMiddleware` / `addUnmountMiddleware` / `addComponentMiddleware` は **後から install した addon ほど外側**に適用される（`install(a, b)` なら実行順は `b → a → コア`）。

遅延 mount には `schedulerAddon()` が必要。`when` や `priority` を使う場合も同様で、これらの mount option は scheduler addon が解釈する。addon の状態（scheduler / pending）は **各 app の `install` ごと**に作られる。

#### Scheduler + cue

```ts
import { schedulerAddon } from "@usenagi/core/addons/scheduler";
import { visible, idle, interaction, media } from "@usenagi/core/addons/cue";
```

| API | 説明 |
| --- | --- |
| `schedulerAddon(opts?)` | 遅延 mount 用 addon |
| `visible(opts?)` | 要素が viewport に入ったときに解決する Cue |
| `idle(timeout?)` | `requestIdleCallback` で解決する Cue |
| `interaction(events?)` | 最初のユーザー操作で解決する Cue |
| `media(query)` | media query が一致したときに解決する Cue |

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

(◯ = 組み込み、△ = 利用側の実装・規約で対応可能、✗ = 主な機能ではない)

- **vs Alpine / petite-vue**: HTML に式を直接書かず、ロジックを `.ts` に集約する。
- **vs Stimulus**: Controller 規約はない。マウント戦略は利用側で自由に組み立てられる。
- **vs React / Vue**: 宣言的 UI フレームワークではなく、既存 DOM に lifecycle を足す薄いレイヤー。

---

## When to use / When not to

**向いているケース:**

- React や Vue のランタイムを持ち込みにくいプロジェクト（CMS、Webflow、WordPress など）
- GSAP や Lenis を多用する、アニメーション主体のサイト
- ページの一部だけにインタラクティブな UI を追加したい場合
- `setup()`、lifecycle、reactivity による composition-style で書きたいが、仮想 DOM は不要な場合

**向いていないケース:**

- リスト描画や条件分岐を HTML テンプレートで書きたい場合（`v-for` や `v-if` 相当はない）
- 複雑なオブジェクトの深いリアクティビティが必要な場合（`reactive({})` は提供しない）
- SSR / hydration が必要な場合
- 状態管理、ルーティング、宣言的な view rendering をフレームワークにまとめて任せたい場合

---

## Examples

| Example                                               | 説明                                                |
| ----------------------------------------------------- | --------------------------------------------------- |
| [basic-counter](../../examples/basic-counter/)            | 最小の `signal` + `useWatch` 例                     |
| [computed](../../examples/computed/)                      | `useComputed` による派生値（width × height = area） |
| [parent-child](../../examples/parent-child/)              | `createContext` + `withContext` + `useSlot`         |
| [deferred-unmount](../../examples/deferred-unmount/)          | `useDeferredUnmount` による退場アニメーション       |
| [lenis-scroll-scene](../../examples/lenis-scroll-scene/)  | Lenis + `useComputed` によるスクロール進捗連動      |
| [byo-mounter recipe](../../examples/recipes/byo-mounter/) | `[data-component]` スキャン + manifest + cue        |

---

## License

MIT © [hayakawasho](https://github.com/hayakawasho)
