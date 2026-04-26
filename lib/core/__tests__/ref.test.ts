import { describe, expect, it } from "vitest";
import { readonly, ref } from "../ref";

describe("ref", () => {
  it("初期値を持つ Ref を作成できる", () => {
    const r = ref(42);
    expect(r.value).toBe(42);
  });

  it("value を書き換えられる", () => {
    const r = ref(0);
    r.value = 99;
    expect(r.value).toBe(99);
  });

  it("各種型に対応できる", () => {
    expect(ref("hello").value).toBe("hello");
    expect(ref(false).value).toBe(false);
    expect(ref(null).value).toBeNull();
    const obj = { a: 1 };
    expect(ref(obj).value).toBe(obj);
  });
});

describe("readonly", () => {
  it("ReadonlyRef は元の Ref の値を返す", () => {
    const r = ref(10);
    const ro = readonly(r);
    expect(ro.value).toBe(10);
  });

  it("元の Ref を変更すると ReadonlyRef にも反映される", () => {
    const r = ref(10);
    const ro = readonly(r);
    r.value = 20;
    expect(ro.value).toBe(20);
  });

  it("ReadonlyRef に setter は存在しないため代入すると例外を投げる", () => {
    const r = ref(10);
    const ro = readonly(r);
    // @ts-expect-error: ReadonlyRef には setter がない
    expect(() => {
      ro.value = 99;
    }).toThrow(TypeError);
    // value は書き換わっていない
    expect(ro.value).toBe(10);
  });
});
