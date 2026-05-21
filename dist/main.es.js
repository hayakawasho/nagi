//#region lib/utils/isAbortError.ts
function e(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
//#endregion
//#region lib/core/internal/pending.ts
function t() {
	let e = /* @__PURE__ */ new Map();
	return {
		add(t) {
			let n = e.get(t);
			n && n.abort();
			let r = new AbortController();
			return e.set(t, r), {
				signal: r.signal,
				complete() {
					return e.get(t) !== r || r.signal.aborted ? !1 : (e.delete(t), !0);
				},
				abort() {
					e.get(t) === r && (r.abort(), e.delete(t));
				}
			};
		},
		abort(t) {
			let n = e.get(t);
			n && (n.abort(), e.delete(t));
		}
	};
}
//#endregion
//#region lib/core/error.ts
function n(e) {
	let t = [], n = e;
	for (; n;) t.unshift(n.name), n = n.parent;
	return t.join(" > ");
}
var r = class e extends Error {
	details;
	constructor(e) {
		super(`[nagi] Component error in phase "${e.phase}" for "${e.name}"${e.path ? ` (${e.path})` : ""}`, { cause: e.cause }), this.name = "LifecycleError", this.details = e;
	}
	static create(t, r, i, a = r.parent, o) {
		return new e({
			phase: t,
			name: r.name,
			uid: r.uid,
			path: n(r),
			parentName: a?.name,
			parentUid: a?.uid,
			element: r.element,
			cause: i,
			...o
		});
	}
};
function i(e) {
	return e instanceof r;
}
//#endregion
//#region lib/core/internal/registry.ts
var a = /* @__PURE__ */ new WeakMap();
function o(e, t) {
	let n = a.get(e);
	if (n) throw r.create("mount", t, /* @__PURE__ */ Error(`Component "${n.name}" (${n.uid}) is already mounted on this element`), n);
	a.set(e, t);
}
//#endregion
//#region lib/core/component.ts
var s = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "Mounted", e.UNMOUNTED = "Unmounted", e;
}({}), c = 0, l = class {
	Mounted = [];
	Unmounted = [];
	parent = null;
	#e = [];
	uid;
	name;
	current = {};
	props = {};
	element;
	provides = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.uid = `${t}.${c++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this.Mounted) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			console.error("[nagi] onMount hook failed", r.create("mount", this, e));
		}
		this.Unmounted.push(...e);
	};
	onUnmount = () => {
		for (let e of this.Unmounted) try {
			e();
		} catch (e) {
			console.error("[nagi] onUnmount cleanup failed", r.create("unmount", this, e));
		}
		for (let e of this.#e) e.onUnmount();
	};
	addChild = (e) => {
		this.#e.push(e), e.parent = this;
		try {
			e.onMount();
		} catch (t) {
			let n = this.#e.indexOf(e);
			throw n !== -1 && this.#e.splice(n, 1), e.parent = null, t;
		}
	};
	removeChild = (e) => {
		let t = this.#e.indexOf(e);
		t !== -1 && (this.#e.splice(t, 1), e.parent = null, e.onUnmount());
	};
	get childElements() {
		return this.#e.map((e) => e.element);
	}
};
function u(e) {
	return e;
}
//#endregion
//#region lib/core/runtime.ts
var d;
function f(e) {
	if (!d) throw Error(`"${e}" called outside setup() will never be run.`);
	return d;
}
function p(e, t, n = {}) {
	let a = new l(t, e.name), o = d;
	d = a;
	try {
		o && (a.parent = o), a.props = n, a.current = e.setup(t, n) || {};
	} catch (e) {
		throw d = o, i(e) ? e : r.create("setup", a, e, o, { props: a.props });
	}
	return d = o, a;
}
//#endregion
//#region lib/core/app.ts
function m(n = {}) {
	let { scheduler: r } = n, i = t();
	return {
		component(t, { priority: n, when: a } = {}) {
			return (s, c) => {
				function l() {
					let e = p(t, s, c);
					return o(s, e), e.onMount(), e;
				}
				if (!r) return l();
				let u = i.add(s), d = () => {
					r.schedule(() => {
						u.complete() && l();
					}, {
						priority: n,
						signal: u.signal
					});
				};
				a ? a(s, u.signal).then(() => {
					u.signal.aborted || d();
				}, (t) => {
					e(t) || (u.abort(), queueMicrotask(() => {
						throw t;
					}));
				}) : d();
			};
		},
		unmount(e) {
			for (let t of e) {
				i.abort(t);
				let e = a.get(t);
				e && (e.onUnmount(), a.delete(t));
			}
		}
	};
}
//#endregion
//#region lib/core/lifecycle.ts
function h(e) {
	return (t) => {
		f(e)[e].push(t);
	};
}
var g = h(s.MOUNTED), _ = h(s.UNMOUNTED);
//#endregion
//#region lib/props.ts
function v() {}
//#endregion
//#region lib/core/reactivity.ts
var y = Symbol("watch"), b = null, x = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return b !== null && b.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[y](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, S = (e) => new x(e), C = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[y](e) {
		return this.#e[y](e);
	}
}, w = (e) => new C(e);
function T(e, t) {
	return e[y](t);
}
function E(e, t) {
	_(T(e, t));
}
function D(e) {
	let t = S(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = b, o = /* @__PURE__ */ new Set();
		b = o;
		let s;
		try {
			s = e();
		} finally {
			b = a;
		}
		t.value = s;
		for (let e of o) n.push(e[y](() => {
			i();
		}));
	};
	return i(), _(r), w(t);
}
//#endregion
//#region lib/hooks/createContext.ts
function O() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = f("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function k(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return f(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/hooks/domRefs.ts
function A(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function j(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !A(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
function M(e, t) {
	let n = /* @__PURE__ */ new Map();
	return new Proxy({}, {
		get(r, i) {
			if (typeof i == "symbol" || i === "then") return;
			if (n.has(i)) return n.get(i);
			let a = j(i, e, t());
			return n.set(i, a), a;
		},
		has(e, t) {
			return typeof t == "string";
		},
		ownKeys() {
			return [];
		},
		getOwnPropertyDescriptor() {},
		set() {
			return !1;
		},
		deleteProperty() {
			return !1;
		}
	});
}
//#endregion
//#region lib/hooks/useDomRef.ts
function N() {
	let e = f("useDomRef");
	return { refs: M(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/useEvent.ts
function P(e, t, n, r) {
	g(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function F(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	i(e), _(() => {
		r.disconnect();
	});
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function I(e, t) {
	let n = window.matchMedia(e), r = S(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return g(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: w(r) };
}
//#endregion
//#region lib/hooks/useSlot.ts
function L() {
	let e = f("useSlot");
	return {
		addChild(t, n, r) {
			let i = (t) => {
				let i = p(n, t, r);
				return e.addChild(i), i;
			};
			return Array.isArray(t) ? t.map((e) => i(e)) : [i(t)];
		},
		removeChild(t) {
			t.forEach((t) => {
				try {
					e.removeChild(t);
				} catch (n) {
					console.error("[nagi] removeChild failed", r.create("removeChild", t, n, e));
				}
			});
		}
	};
}
//#endregion
export { r as LifecycleError, m as create, O as createContext, u as defineComponent, i as isLifecycleError, v as propTypes, w as readonly, S as signal, D as useComputed, N as useDomRef, P as useEvent, F as useIntersectionWatch, I as useMediaQuery, g as useMount, L as useSlot, _ as useUnmount, E as useWatch, k as withContext };
