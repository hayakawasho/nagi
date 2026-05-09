//#region lib/core/internal/pending.ts
function e() {
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
function t(e) {
	let t = [], n = e;
	for (; n;) t.unshift(n.name), n = n.parent;
	return t.join(" > ");
}
var n = class e extends Error {
	details;
	constructor(e) {
		super(`[Lake] Component error in phase "${e.phase}" for "${e.name}"${e.path ? ` (${e.path})` : ""}`, { cause: e.cause }), this.name = "LifecycleError", this.details = e;
	}
	static create(n, r, i, a = r.parent, o) {
		return new e({
			phase: n,
			name: r.name,
			uid: r.uid,
			path: t(r),
			parentName: a?.name,
			parentUid: a?.uid,
			element: r.element,
			cause: i,
			...o
		});
	}
};
function r(e) {
	return e instanceof n;
}
//#endregion
//#region lib/core/internal/registry.ts
var i = /* @__PURE__ */ new WeakMap();
function a(e, t) {
	let r = i.get(e);
	if (r) throw n.create("mount", t, /* @__PURE__ */ Error(`Component "${r.name}" (${r.uid}) is already mounted on this element`), r);
	i.set(e, t);
}
//#endregion
//#region lib/core/component.ts
var o = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "Mounted", e.UNMOUNTED = "Unmounted", e;
}({}), s = 0, c = class {
	[o.MOUNTED] = [];
	[o.UNMOUNTED] = [];
	parent = null;
	#e = [];
	uid;
	name;
	current = {};
	props = {};
	element;
	provides = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.uid = `${t}.${s++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this[o.MOUNTED]) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			console.error("[Lake] onMount hook failed", n.create("mount", this, e));
		}
		this[o.UNMOUNTED].push(...e);
	};
	onUnmount = () => {
		for (let e of this[o.UNMOUNTED]) try {
			e();
		} catch (e) {
			console.error("[Lake] onUnmount cleanup failed", n.create("unmount", this, e));
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
function l(e) {
	return e === void 0 ? (e) => (t) => ({
		name: e.name,
		setup(n) {
			return e.setup(n, t);
		}
	}) : e;
}
//#endregion
//#region lib/core/runtime.ts
var u;
function d(e) {
	if (!u) throw Error(`"${e}" called outside setup() will never be run.`);
	return u;
}
function f(e, t, i) {
	let a = new c(t, e.name), o = u;
	u = a;
	try {
		o && (a.parent = o), a.props = i, a.current = e.setup(t, i) || {};
	} catch (e) {
		throw u = o, r(e) ? e : n.create("setup", a, e, o, { props: a.props });
	}
	return u = o, a;
}
//#endregion
//#region lib/core/app.ts
function p(t = {}) {
	let { scheduler: n } = t, r = e();
	return {
		component(e, { priority: t } = {}) {
			return (i, o = {}) => {
				function s() {
					let t = f(e, i, o);
					return a(i, t), t.onMount(), t;
				}
				if (!n) return s();
				let c = r.add(i);
				n.schedule(() => {
					c.complete() && s();
				}, {
					priority: t,
					signal: c.signal
				});
			};
		},
		unmount(e) {
			for (let t of e) {
				r.abort(t);
				let e = i.get(t);
				e && (e.onUnmount(), i.delete(t));
			}
		}
	};
}
//#endregion
//#region lib/core/lifecycle.ts
function m(e) {
	return (t) => {
		d(e)[e].push(t);
	};
}
var h = m(o.MOUNTED), g = m(o.UNMOUNTED), _ = Symbol("watch"), v = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[_](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, y = (e) => new v(e), b = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[_](e) {
		return this.#e[_](e);
	}
}, x = (e) => new b(e);
function S(e, t) {
	return e[_](t);
}
function C(e, t) {
	g(S(e, t));
}
//#endregion
//#region lib/hooks/createContext.ts
function w() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = d("createContext.use").parent;
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function T(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return d(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/hooks/domRefs.ts
function E(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function D(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !E(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
function O(e, t) {
	let n = /* @__PURE__ */ new Map();
	return new Proxy({}, {
		get(r, i) {
			if (typeof i == "symbol" || i === "then") return;
			if (n.has(i)) return n.get(i);
			let a = D(i, e, t());
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
function k() {
	let e = d("useDomRef");
	return { refs: O(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/useEvent.ts
function A(e, t, n, r) {
	h(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function j(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	i(e), g(() => {
		r.disconnect();
	});
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function M(e, t) {
	let n = window.matchMedia(e), r = y(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return h(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: x(r) };
}
//#endregion
//#region lib/hooks/useRootRef.ts
function N() {
	return d("useRootRef").element;
}
//#endregion
//#region lib/hooks/useSlot.ts
function P() {
	let e = d("useSlot");
	return {
		addChild(t, n, r = {}) {
			let i = (t) => {
				let i = f(n, t, r);
				return e.addChild(i), i;
			};
			return Array.isArray(t) ? t.map((e) => i(e)) : [i(t)];
		},
		removeChild(t) {
			t.forEach((t) => {
				try {
					e.removeChild(t);
				} catch (r) {
					console.error("[Lake] removeChild failed", n.create("removeChild", t, r, e));
				}
			});
		}
	};
}
//#endregion
export { n as LifecycleError, p as create, w as createContext, l as defineComponent, r as isLifecycleError, x as readonly, y as ref, k as useDomRef, A as useEvent, j as useIntersectionWatch, M as useMediaQuery, h as useMount, N as useRootRef, P as useSlot, g as useUnmount, C as useWatch, T as withContext };
