//#region lib/core/addon.ts
function e(e) {
	return e;
}
//#endregion
//#region lib/core/_internal/addonRegistry.ts
function t() {
	let e = /* @__PURE__ */ new Set(), t = [], n = [], r = [], i = {
		get installedAddons() {
			return e;
		},
		addComponentMiddleware(e) {
			t.push(e);
		},
		addMountMiddleware(e) {
			n.push(e);
		},
		addUnmountMiddleware(e) {
			r.push(e);
		},
		composeComponent(e) {
			return t.reduce((e, t) => t(e), e);
		},
		composeMount(e, t, r) {
			return n.reduce((e, n) => n(e, t, r), e);
		},
		composeUnmount(e) {
			return r.reduce((e, t) => t(e), e);
		},
		install(t) {
			if (e.has(t.name)) throw Error(`[nagi] addon "${t.name}" is already installed`);
			t.install(i), e.add(t.name);
		}
	};
	return i;
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
//#region lib/core/_internal/registry.ts
var a = /* @__PURE__ */ new WeakMap();
function o(e, t) {
	let n = a.get(e);
	if (n) throw r.create("mount", t, /* @__PURE__ */ Error(`Component "${n.name}" (${n.uid}) is already mounted on this element`), n);
	a.set(e, t);
}
//#endregion
//#region lib/core/_internal/component.ts
var s = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "Mounted", e.UNMOUNTED = "Unmounted", e;
}(s || {}), c = 0, l = class {
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
}, u;
function d(e) {
	if (!u) throw Error(`"${e}" called outside setup() will never be run.`);
	return u;
}
function f(e, t, n = {}) {
	let a = new l(t, e.name), o = u;
	u = a;
	try {
		o && (a.parent = o), a.props = n, a.current = e.setup(t, n) || {};
	} catch (e) {
		throw u = o, i(e) ? e : r.create("setup", a, e, o, { props: a.props });
	}
	return u = o, a;
}
//#endregion
//#region lib/core/app.ts
function p() {
	let e = t(), n = (e) => {
		for (let t of e) {
			let e = a.get(t);
			e && (e.onUnmount(), a.delete(t));
		}
	}, r = {
		install(...t) {
			return t.forEach(e.install), r;
		},
		component(t, n = {}) {
			let r = e.composeComponent(t), i = e.composeMount((e, t) => {
				let n = f(r, e, t);
				return o(e, n), n.onMount(), n;
			}, r, n);
			return (e, t = {}) => i(e, t);
		},
		unmount(t) {
			e.composeUnmount(n)(t);
		}
	};
	return r;
}
//#endregion
//#region lib/core/component.ts
function m(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function h() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = d("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function g(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return d(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
function _(e) {
	return (t) => {
		d(e)[e].push(t);
	};
}
var v = _(s.MOUNTED), y = _(s.UNMOUNTED);
//#endregion
//#region lib/core/props.ts
function b() {}
//#endregion
//#region lib/core/reactivity.ts
var x = Symbol("watch"), S = null, C = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return S !== null && S.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[x](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, w = (e) => new C(e), T = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[x](e) {
		return this.#e[x](e);
	}
}, E = (e) => new T(e);
function D(e, t) {
	return e[x](t);
}
function O(e, t) {
	y(D(e, t));
}
function k(e) {
	let t = w(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = S, o = /* @__PURE__ */ new Set();
		S = o;
		let s;
		try {
			s = e();
		} finally {
			S = a;
		}
		t.value = s;
		for (let e of o) n.push(e[x](() => {
			i();
		}));
	};
	return i(), y(r), E(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
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
function N() {
	let e = d("useDomRef");
	return { refs: M(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function P() {
	let e = d("useSlot");
	return {
		addChild(t, n, r) {
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
				} catch (n) {
					console.error("[nagi] removeChild failed", r.create("removeChild", t, n, e));
				}
			});
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function F(e, t, n, r) {
	v(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function I(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	v(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function L(e, t) {
	let n = window.matchMedia(e), r = w(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return v(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: E(r) };
}
//#endregion
export { r as LifecycleError, p as create, h as createContext, e as defineAddon, m as defineComponent, i as isLifecycleError, b as propTypes, E as readonly, w as signal, k as useComputed, N as useDomRef, F as useEvent, I as useIntersectionWatch, L as useMediaQuery, v as useMount, P as useSlot, y as useUnmount, O as useWatch, g as withContext };
