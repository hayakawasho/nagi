import {
  create,
  useDomRef,
  useEvent
} from "@usenagi/core";
import {
  batch,
  signal,
  useSignalEffect,
} from "@usenagi/core/addons/signals";

type Refs = {
  loadBatch: HTMLButtonElement;
  loadNoBatch: HTMLButtonElement;
  reset: HTMLButtonElement;
  loading: HTMLElement;
  data: HTMLElement;
  error: HTMLElement;
  log: HTMLOListElement;
};

const { component } = create();

component({
  name: "root",
  setup() {
    const { refs } = useDomRef<Refs>();

    const loading = signal(false);
    const data = signal<string | null>(null);
    const error = signal<string | null>(null);

    let count = 0;

    useSignalEffect(() => {
      count += 1;

      refs.loading.textContent = String(loading.value);
      refs.data.textContent = String(data.value);
      refs.error.textContent = String(error.value);

      const line = document.createElement("li");
      line.textContent = `effect 発火 #${count}: loading=${loading.value}, data=${data.value}, error=${error.value}`;
      refs.log.append(line);
    });

    const fakeFetch = () =>
      new Promise<string>((resolve) => {
        setTimeout(() => resolve("取得したデータ"), 300);
      });

    useEvent(refs.loadBatch, "click", async () => {
      batch(() => {
        loading.value = true;
        data.value = null;
        error.value = null;
      });

      const result = await fakeFetch();

      batch(() => {
        loading.value = false;
        data.value = result;
        error.value = null;
      });
    });

    useEvent(refs.loadNoBatch, "click", async () => {
      loading.value = true;
      data.value = null;
      error.value = null;

      const result = await fakeFetch();

      loading.value = false;
      data.value = result;
      error.value = null;
    });

    useEvent(refs.reset, "click", () => {
      batch(() => {
        loading.value = false;
        data.value = null;
        error.value = null;
      });

      refs.log.innerHTML = "";
      count = 0;
    });
  },
})(document.getElementById("root") as HTMLElement);
