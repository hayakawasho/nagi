declare class Ref<T> {
    #private;
    constructor(value: T);
    get value(): T;
    set value(newVal: T);
}
declare const ref: <T = any>(val: T) => Ref<T>;
declare class ReadonlyRef<T> {
    #private;
    constructor(value: Ref<T>);
    get value(): T;
}
declare const readonly: <T = any>(ref: Ref<T>) => ReadonlyRef<T>;
export { ref, readonly };
export type { Ref, ReadonlyRef };
//# sourceMappingURL=ref.d.ts.map