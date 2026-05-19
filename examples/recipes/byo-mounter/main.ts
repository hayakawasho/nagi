/**
 * BYO mounter recipe
 *
 * nagi のコアは [data-component] のスキャンや manifest の解決を意図的に含まない。
 * どうスキャンするか、どう遅延させるかはプロジェクトが自由に決められる。
 * これはその「一つの書き方」の例。
 *
 * 別の書き方例:
 *   - dynamic import でコンポーネントを遅延ロード
 *   - Map や Class ベースの registry パターン
 *   - MutationObserver で DOM 挿入を監視して自動マウント
 */

import {
  create,
  defineComponent,
  signal,
  useDomRef,
  useWatch,
  useMount,
} from "../../../lib/main";
import { createScheduler } from "../../../lib/addons/scheduler";
import { idle, interaction, visible, media } from "../../../lib/addons/cue";

import type { ComponentSetup, SchedulePriority } from "../../../lib/types";

// -----------------------------------------------------------------
// コンポーネント定義
// -----------------------------------------------------------------

const Counter = defineComponent({
  name: "counter",
  setup() {
    const { refs } = useDomRef<{
      count: HTMLSpanElement;
      inc: HTMLButtonElement;
      dec: HTMLButtonElement;
    }>();

    const n = signal(0);

    useWatch(n, (v) => {
      refs.count.textContent = String(v);
    });

    refs.count.textContent = "0";
    refs.inc.addEventListener("click", () => {
      n.value += 1;
    });
    refs.dec.addEventListener("click", () => {
      n.value -= 1;
    });

    useMount(() => {
      console.log("counter component mounted");
    });

    console.log("counter component setup done");
  },
});

const Banner = defineComponent({
  name: "banner",
  setup(el) {
    el.textContent = "👋 This banner mounted when it became visible.";
    el.style.opacity = "1";
  },
});

const IdleWidget = defineComponent({
  name: "idle-widget",
  setup(el) {
    el.textContent = "💤 This widget mounted during browser idle time.";
    el.style.opacity = "1";
  },
});

// -----------------------------------------------------------------
// ComponentSetup のマッピング
// -----------------------------------------------------------------

const manifest: Record<string, ComponentSetup> = {
  counter: Counter,
  banner: Banner,
  "idle-widget": IdleWidget,
};

// 未登録コンポーネント用の Noop fallback
const Noop: ComponentSetup = {
  name: "noop",
  setup(el) {
    const name = el.dataset.component ?? "unknown";
    console.warn(`[byo-mounter] unknown component: "${name}"`);
  },
};

// -----------------------------------------------------------------
// cue マッピング
// -----------------------------------------------------------------

function mountWhen(raw: string | undefined) {
  if (!raw) {
    return;
  }

  const [when, spec] = raw.split(":", 2);

  switch (when) {
    case "visible":
      return visible();
    case "idle":
      return idle();
    case "media":
      if (!spec) {
        return;
      }
      return media(spec);
    case "interaction": {
      const events = spec?.split(",").map((s) => s.trim());
      return interaction(events);
    }
    default:
      return;
  }
}

// -----------------------------------------------------------------
// mounter
// -----------------------------------------------------------------

const scheduler = createScheduler();
const app = create({ scheduler });

document.querySelectorAll<HTMLElement>("[data-component]").forEach((el) => {
  const name = el.dataset.component ?? "";
  const priority = el.dataset.priority as SchedulePriority | undefined;
  const when = mountWhen(el.dataset.mountWhen);

  const setup = manifest[name] ?? Noop;

  try {
    app.component(setup, { priority, when })(el);
  } catch (err) {
    console.error(`[byo-mounter] failed to mount "${name}"`, err);
  }
});
