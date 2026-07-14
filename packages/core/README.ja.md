[English](./README.md) | **日本語**

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

    useDeferredUnmount(() => {
      return new Promise((resolve) => {
        gsap.to(el, { opacity: 0, y: -20, duration: 0.3, onComplete: resolve });
      });
    });

    useUnmount(() => el.remove());
  },
})(document.querySelector(".modal")!);
```

mount 時に登場アニメーション、unmount 前に退場アニメーション、unmount 時にクリーンアップ。すべて1つの `setup()` に収まる。

---

## Why nagi?

**既存 HTML にライフサイクルを足せる**

WordPress、CMS、Webflow、静的サイトなどに、仮想 DOM やテンプレートを持ち込まず `setup()` / lifecycle / reactivity を追加できる。

**アニメーションと相性が良い**

GSAP、Lenis、IntersectionObserver などを `setup()` で初期化し、`useUnmount()` でクリーンアップできる。`useDeferredUnmount()` で退場アニメーションなどの非同期処理を unmount の前に挟むこともできる。

**マウント戦略を縛らない**

`[data-component]` スキャン、manifest、lazy import、MutationObserver — マウント戦略は利用側で自由に組み立てられる。

---

## Quick start

```bash
npm i @usenagi/core
```

### First component

```ts
import { create, defineComponent, propTypes, useDomRef } from "@usenagi/core";
import { signal, useWatch } from "@usenagi/core/addons/signals";

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

### Reactivity（signals addon）

リアクティビティは `signals` addon が提供する。同じパッケージ内の別エントリ（`@usenagi/core/addons/signals`）で、[@preact/signals-core](https://github.com/preactjs/signals) ベースのグリッチフリーな評価・遅延評価の `computed` を備える。

`@preact/signals-core` はパッケージの dependencies に含まれるが、読み込まれるのは `@usenagi/core/addons/signals` を import したときだけ。core エントリはリアクティビティを含まないため、バンドルコストはかからない。

| API                    | 説明                                                   |
| ---------------------- | ------------------------------------------------------ |
| `signal(value)`        | `.value` を持つリアクティブな値コンテナを作成する      |
| `readonly(signal)`     | 書き込み可能な `signal` の読み取り専用ラッパー         |
| `useComputed(fn)`      | `signal` の依存を自動追跡する派生値（グリッチフリー・遅延評価） |
| `useWatch(target, cb)` | 値変更時に `cb` を呼ぶ。unmount 時に自動で購読解除する |
| `batch(fn)`            | 複数の更新を1回の通知にまとめる                        |
| `useSignalEffect(fn)`  | 読み取りを自動追跡し、unmount 時に破棄する             |
| `untracked(fn)`        | 購読せずに signal を読み取る                           |

```ts
import { batch, signal, useComputed, useSignalEffect, useWatch } from "@usenagi/core/addons/signals";

const a = signal(1);
const b = signal(2);
const sum = useComputed(() => a.value + b.value);

setup() {
  useWatch(sum, (v) => { /* 最終値で1回だけ発火 */ });
  useSignalEffect(() => { /* 読み取りを自動追跡、unmount で破棄 */ });
}

batch(() => {
  a.value = 10;
  b.value = 20; // 通知は2回ではなく1回
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
| `useEvent(target, event, handler)` | 任意の `EventTarget`（要素 / `window` / `document` / `MediaQueryList` など）にイベントリスナーを追加する。unmount 時に自動で除去する |
| `useSlot()`                    | 子コンポーネントをマウントする。親の unmount に連動する |

### Parent / child

`useSlot()` で子コンポーネントをマウントできる。親から子へは `props` または `createContext` / `withContext` で値を渡せる。`addChild()` が返す child context から、子の `setup()` の返り値も参照できる。

→ [examples/parent-child](../../examples/parent-child/main.ts)

### Observers

| API                               | 説明                                                        |
| --------------------------------- | ----------------------------------------------------------- |
| `useIntersectionWatch(cb, opts?)` | IntersectionObserver のラッパー。unmount 時に自動で切断する |

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
| `ctx.addDebugReporter` / `ctx.emitDebugEvent` | debug reporter の登録 / app の reporter への debug イベント発行 |
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

#### Debug addon

`debugAddon()` を install すると、ライフサイクルエラー（`setup` / `mount` / `unmount` / `deferredUnmount` / `removeChild`）が整形されたログとして `console.error` に出力される。さらに info レベルのトレース — コンポーネントの `mount` / `unmount`、scheduler の cue の状態（`pending` / `resolved` / `aborted`）— が `console.info` に出力され、「マウントされたのか」「何を待っているのか」を確認できる。reporter は app インスタンスごとに独立しており、あるアプリに install しても他のアプリには影響しない。reporter がなければ info イベントは構築すらされない。

```
[nagi:debug] info:scheduler:pending banner <div.banner> waiting: visible
[nagi:debug] info:scheduler:resolved banner <div.banner> cue: visible
[nagi:debug] info:lifecycle:mount banner (banner.2) <div.banner>
```

```ts
import { create } from "@usenagi/core";
import { debugAddon } from "@usenagi/core/addons/debug";

const app = create().install(debugAddon());
```

addon 作者は `ctx.addDebugReporter(reporter)` で独自の reporter を追加でき、`ctx.emitDebugEvent(event)` で同じチャネルに独自のイベントを発行できる（scheduler addon の cue トレースはこの仕組みの上に作られている）。複数登録した場合、すべての reporter に通知される。`DebugEvent` は error / info のユニオンなので `event.level` で分岐すること。`cause` は error イベントにのみ存在する。

---

## Comparison

|                            | **nagi** | Alpine.js | Stimulus | petite-vue |
| -------------------------- | -------- | --------- | -------- | ---------- |
| Inline JS in HTML          | ✗        | ◯         | ✗        | ◯          |
| Composition-style setup    | ◯        | △         | ✗        | ◯          |
| BYO mounter                | ◯        | △         | △        | △          |
| Async mount cue            | ◯        | ✗         | ✗        | ✗          |
| Lifecycle cleanup          | ◯        | △         | ◯        | △          |
| computed (derived signals) | ◯ (addon) | ◯        | ✗        | ◯          |
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
