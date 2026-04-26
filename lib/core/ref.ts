class Ref<T> {
  #rawValue: T;

  constructor(value: T) {
    this.#rawValue = value;
  }

  get value() {
    return this.#rawValue;
  }

  set value(newVal: T) {
    this.#rawValue = newVal;
  }
}

// biome-ignore lint/suspicious/noExplicitAny: generic default
const ref = <T = any>(val: T) => new Ref(val);

class ReadonlyRef<T> {
  #ref: Ref<T>;

  constructor(value: Ref<T>) {
    this.#ref = value;
  }

  get value() {
    return this.#ref.value;
  }
}

// biome-ignore lint/suspicious/noExplicitAny: generic default
const readonly = <T = any>(ref: Ref<T>) => new ReadonlyRef(ref);

export type { ReadonlyRef, Ref };
export { readonly, ref };
