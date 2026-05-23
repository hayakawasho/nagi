//#region lib/core/addon.ts
function e(e) {
	return e;
}
//#endregion
//#region lib/core/_internal/addonRegistry.ts
var t = class {
	#e = /* @__PURE__ */ new Set();
	#t = [];
	#n = [];
	#r = [];
	get installedAddons() {
		return this.#e;
	}
	addComponentMiddleware(e) {
		this.#t.push(e);
	}
	addMountMiddleware(e) {
		this.#n.push(e);
	}
	addUnmountMiddleware(e) {
		this.#r.push(e);
	}
	composeComponent(e) {
		return this.#t.reduce((e, t) => t(e), e);
	}
	composeMount(e, t, n) {
		return this.#n.reduce((e, r) => r(e, t, n), e);
	}
	composeUnmount(e) {
		return this.#r.reduce((e, t) => t(e), e);
	}
	install = (e) => {
		if (this.#e.has(e.name)) throw Error(`[nagi] addon "${e.name}" is already installed`);
		e.install(this), this.#e.add(e.name);
	};
}, n = () => new t();
//#endregion
//#region lib/core/error.ts
function r(e) {
	let t = [], n = e;
	for (; n;) t.unshift(n.name), n = n.parent;
	return t.join(" > ");
}
var i = class e extends Error {
	details;
	constructor(e) {
		super(`[nagi] Component error in phase "${e.phase}" for "${e.name}"${e.path ? ` (${e.path})` : ""}`, { cause: e.cause }), this.name = "LifecycleError", this.details = e;
	}
	static create(t, n, i, a = n.parent, o) {
		return new e({
			phase: t,
			name: n.name,
			uid: n.uid,
			path: r(n),
			parentName: a?.name,
			parentUid: a?.uid,
			element: n.element,
			cause: i,
			...o
		});
	}
};
function a(e) {
	return e instanceof i;
}
//#endregion
//#region lib/core/_internal/registry.ts
var o = /* @__PURE__ */ new WeakMap();
function s(e, t) {
	let n = o.get(e);
	if (n) throw i.create("mount", t, /* @__PURE__ */ Error(`Component "${n.name}" (${n.uid}) is already mounted on this element`), n);
	o.set(e, t);
}
//#endregion
//#region lib/core/_internal/component.ts
var c = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "Mounted", e.UNMOUNTED = "Unmounted", e;
}(c || {}), l = 0, u = class {
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
		this.uid = `${t}.${l++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this.Mounted) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			console.error("[nagi] onMount hook failed", i.create("mount", this, e));
		}
		this.Unmounted.push(...e);
	};
	onUnmount = () => {
		for (let e of this.Unmounted) try {
			e();
		} catch (e) {
			console.error("[nagi] onUnmount cleanup failed", i.create("unmount", this, e));
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
}, d;
function f(e) {
	if (!d) throw Error(`"${e}" called outside setup() will never be run.`);
	return d;
}
function p(e, t, n = {}) {
	let r = new u(t, e.name), o = d;
	d = r;
	try {
		o && (r.parent = o), r.props = n, r.current = e.setup(t, n) || {};
	} catch (e) {
		throw d = o, a(e) ? e : i.create("setup", r, e, o, { props: r.props });
	}
	return d = o, r;
}
//#endregion
//#region lib/core/app.ts
function m() {
	let e = n(), t = (e) => {
		for (let t of e) {
			let e = o.get(t);
			e && (e.onUnmount(), o.delete(t));
		}
	}, r = {
		install(...t) {
			return t.forEach(e.install), r;
		},
		component(t, n = {}) {
			let r = e.composeComponent(t), i = e.composeMount((e, t) => {
				let n = p(r, e, t);
				return s(e, n), n.onMount(), n;
			}, r, n);
			return (e, t = {}) => i(e, t);
		},
		unmount(n) {
			e.composeUnmount(t)(n);
		}
	};
	return r;
}
//#endregion
//#region lib/core/component.ts
function h(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function g() {
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
function _(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return f(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
function v(e) {
	return (t) => {
		f(e)[e].push(t);
	};
}
var y = v(c.MOUNTED), b = v(c.UNMOUNTED);
//#endregion
//#region lib/core/props.ts
function x() {}
//#endregion
//#region lib/core/reactivity.ts
var S = Symbol("watch"), C = null, w = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return C !== null && C.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[S](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, T = (e) => new w(e), E = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[S](e) {
		return this.#e[S](e);
	}
}, D = (e) => new E(e);
function O(e, t) {
	return e[S](t);
}
function k(e, t) {
	b(O(e, t));
}
function A(e) {
	let t = T(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = C, o = /* @__PURE__ */ new Set();
		C = o;
		let s;
		try {
			s = e();
		} finally {
			C = a;
		}
		t.value = s;
		for (let e of o) n.push(e[S](() => {
			i();
		}));
	};
	return i(), b(r), D(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
function j(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function M(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !j(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
function N(e, t) {
	let n = /* @__PURE__ */ new Map();
	return new Proxy({}, {
		get(r, i) {
			if (typeof i == "symbol" || i === "then") return;
			if (n.has(i)) return n.get(i);
			let a = M(i, e, t());
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
function P() {
	let e = f("useDomRef");
	return { refs: N(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function F() {
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
					console.error("[nagi] removeChild failed", i.create("removeChild", t, n, e));
				}
			});
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function I(e, t, n, r) {
	y(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function L(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	y(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function R(e, t) {
	let n = window.matchMedia(e), r = T(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return y(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: D(r) };
}
//#endregion
export { i as LifecycleError, m as create, g as createContext, e as defineAddon, h as defineComponent, a as isLifecycleError, x as propTypes, D as readonly, T as signal, A as useComputed, P as useDomRef, I as useEvent, L as useIntersectionWatch, R as useMediaQuery, y as useMount, F as useSlot, b as useUnmount, k as useWatch, _ as withContext };
