import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create } from "../core/app";

import { useMediaQuery } from "./useMediaQuery";

type MockMQL = {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  simulateChange: (matches: boolean) => void;
};

function createMockMQL(initialMatches: boolean): MockMQL {
  const listeners: Array<(evt: MediaQueryListEvent) => void> = [];
  return {
    matches: initialMatches,
    addEventListener: vi.fn(
      (_type: string, cb: (evt: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
    ),
    removeEventListener: vi.fn(),
    simulateChange(matches: boolean) {
      listeners.forEach((cb) => {
        cb({ matches } as MediaQueryListEvent);
      });
    },
  };
}

let mockMQL: MockMQL;

beforeEach(() => {
  mockMQL = createMockMQL(false);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mockMQL),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("useMediaQuery", () => {
  it("matchesQuery を ReadonlyRef として返す", () => {
    const root = makeEl();
    let matchesQuery: unknown;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const result = useMediaQuery(
          "(min-width:640px)",
          vi.fn().mockReturnValue(() => {}),
        );
        matchesQuery = result.matchesQuery;
      },
    })(root);
    expect(matchesQuery).toHaveProperty("value");
  });

  it("初期値は mediaQueryList.matches に基づく", () => {
    mockMQL = createMockMQL(true);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mockMQL),
    );

    const root = makeEl();
    let initialValue: boolean | undefined;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const { matchesQuery } = useMediaQuery(
          "(min-width:640px)",
          vi.fn().mockReturnValue(() => {}),
        );
        initialValue = matchesQuery.value;
      },
    })(root);
    expect(initialValue).toBe(true);
  });

  it("初期マッチ時にコールバックが呼ばれる", () => {
    mockMQL = createMockMQL(true);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mockMQL),
    );

    const root = makeEl();
    const callback = vi.fn().mockReturnValue(() => {});
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useMediaQuery("(min-width:640px)", callback);
      },
    })(root);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("初期非マッチ時にコールバックは呼ばれない", () => {
    const root = makeEl();
    const callback = vi.fn().mockReturnValue(() => {});
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useMediaQuery("(min-width:640px)", callback);
      },
    })(root);
    expect(callback).not.toHaveBeenCalled();
  });

  it("メディアクエリが一致したときコールバックが呼ばれる", () => {
    const root = makeEl();
    const callback = vi.fn().mockReturnValue(() => {});
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useMediaQuery("(min-width:640px)", callback);
      },
    })(root);

    mockMQL.simulateChange(true);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("メディアクエリが非一致になったとき cleanup が呼ばれる", () => {
    mockMQL = createMockMQL(true);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mockMQL),
    );

    const root = makeEl();
    const cleanup = vi.fn();
    const callback = vi.fn().mockReturnValue(cleanup);
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        useMediaQuery("(min-width:640px)", callback);
      },
    })(root);

    mockMQL.simulateChange(false);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("アンマウント時に removeEventListener と cleanup が呼ばれる", () => {
    mockMQL = createMockMQL(true);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mockMQL),
    );

    const root = makeEl();
    const cleanup = vi.fn();
    const { component, unmount } = create();
    component({
      name: "test",
      setup: () => {
        useMediaQuery("(min-width:640px)", () => cleanup);
      },
    })(root);

    unmount([root]);
    expect(mockMQL.removeEventListener).toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalled();
  });

  it("[バグ] メディアクエリ変化時に matchesQuery.value が更新される", () => {
    const root = makeEl();
    let matchesRef: { value: boolean } | undefined;
    const { component } = create();
    component({
      name: "test",
      setup: () => {
        const result = useMediaQuery(
          "(min-width:640px)",
          vi.fn().mockReturnValue(() => {}),
        );
        matchesRef = result.matchesQuery;
      },
    })(root);

    expect(matchesRef?.value).toBe(false); // 初期値

    mockMQL.simulateChange(true);
    expect(matchesRef?.value).toBe(true); // 変化後
  });
});
