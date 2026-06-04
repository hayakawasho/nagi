import {
  create,
  defineComponent,
  propTypes,
  useDeferredUnmount,
  useEvent,
  useMount,
  useUnmount,
  useSlot,
  useDomRef,
} from "../../packages/core/lib/main";
import type { ComponentContext } from "../../packages/core/lib/main";

function waitForTransition(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    el.addEventListener("transitionend", () => resolve(), { once: true });
  });
}

function createModalElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "modal-overlay";
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h2 id="modal-title">ユーザーの削除</h2>
        <button class="modal-close" data-ref="close" type="button" aria-label="閉じる">&times;</button>
      </div>
      <div class="modal-body">
        <p>「山田 太郎」を削除してもよいですか？<br>この操作は取り消せません。</p>
      </div>
      <div class="modal-footer">
        <button data-ref="cancel" type="button">キャンセル</button>
        <button data-ref="confirm" type="button" class="btn-danger">削除する</button>
      </div>
    </div>
  `;
  return el;
}

// Modal — 退場アニメーションの詳細は自身に閉じている
const Modal = defineComponent({
  name: "modal",
  props: propTypes<{ onClose: () => void; onConfirm: () => void }>(),
  setup(el: HTMLElement, props) {
    const { refs } = useDomRef<{
      close: HTMLButtonElement;
      cancel: HTMLButtonElement;
      confirm: HTMLButtonElement;
    }>();

    useMount(() => {
      el.offsetHeight; // enter transition のための reflow
      el.classList.add("is-open");
    });

    // バックドロップ直接クリックで閉じる
    useEvent(el, "click", (e) => {
      if (e.target === el) props.onClose();
    });

    useEvent(refs.close, "click", props.onClose);
    useEvent(refs.cancel, "click", props.onClose);
    useEvent(refs.confirm, "click", props.onConfirm);

    // HOW: アニメーションの詳細はコンポーネントだけが知っている
    useDeferredUnmount(async () => {
      el.classList.remove("is-open");
      await waitForTransition(el);
    });

    useUnmount(() => {
      el.remove();
    });
  },
});

// App — WHEN: いつ開閉するかを制御する
const App = defineComponent({
  name: "app",
  setup() {
    const { addChild, removeChild } = useSlot();
    const { refs } = useDomRef<{
      openBtn: HTMLButtonElement;
      status: HTMLElement;
      container: HTMLElement;
    }>();

    let modalEl: HTMLElement | null = null;
    let modalCtx: ComponentContext | null = null;

    const closeModal = async () => {
      if (!modalCtx) return;

      const ctx = modalCtx;
      modalCtx = null;
      modalEl = null;
      refs.openBtn.disabled = false;

      await removeChild([ctx]);
    };

    const openModal = () => {
      if (modalCtx) return;
      refs.openBtn.disabled = true;
      modalEl = createModalElement();
      refs.container.appendChild(modalEl);
      [modalCtx] = addChild(modalEl, Modal, {
        onClose: closeModal,
        onConfirm: async () => {
          refs.status.textContent = "削除しています...";
          await closeModal();
          refs.status.textContent = "削除しました。";
          setTimeout(() => {
            refs.status.textContent = "";
          }, 2000);
        },
      });
    };

    useEvent(refs.openBtn, "click", openModal);
  },
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app");
  if (!root) return;
  create().component(App)(root);
});
