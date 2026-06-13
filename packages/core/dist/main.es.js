//#region lib/core/addon.ts
function e(e) {
	return e;
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
		super(`[nagi] Component error in phase "${e.phase}" for "${e.name}"${e.path ? ` (${e.path})` : ""}`, { cause: e.cause }), this.name = "LifecycleError", this.details = e;
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
//#region lib/core/_internal/debugEvents.ts
var i = {
	setup: "[nagi] setup failed",
	mount: "[nagi] onMount hook failed",
	deferredUnmount: "[nagi] useDeferredUnmount hook failed",
	unmount: "[nagi] onUnmount cleanup failed",
	removeChild: "[nagi] removeChild failed"
}, a = (e, t) => {
	console.error(i[t.details.phase], t);
};
function o(e) {
	a = (t) => e(t);
}
function s(e) {
	return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ""}${Array.from(e.classList).map((e) => `.${e}`).join("")}`;
}
function c(e) {
	let { details: t } = e;
	return {
		version: 1,
		level: "error",
		source: "lifecycle",
		type: "error",
		phase: t.phase,
		name: t.name,
		uid: t.uid,
		path: t.path,
		parentUid: t.parentUid,
		element: t.element,
		elementLabel: t.element ? s(t.element) : void 0,
		props: t.props,
		cause: t.cause
	};
}
function l(e, t) {
	try {
		a(e, t);
	} catch (e) {
		console.error("[nagi] debug reporter failed", e);
	}
}
function u(e, t, r, i, a) {
	let o = n.create(e, t, r, i, a);
	return l(c(o), o), o;
}
//#endregion
//#region lib/core/_internal/addonRegistry.ts
var d = class {
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
	setDebugReporter(e) {
		o(e);
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
}, f = () => new d(), p = /* @__PURE__ */ new WeakMap();
function m(e, t) {
	let r = p.get(e);
	if (r) throw n.create("mount", t, /* @__PURE__ */ Error(`Component "${r.name}" (${r.uid}) is already mounted on this element`), r);
	p.set(e, t);
}
//#endregion
//#region lib/core/_internal/errorReport.ts
function h(e, t, n, r) {
	u(e, t, n, r);
}
//#endregion
//#region lib/core/_internal/component.ts
var g = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "mount", e.UNMOUNTED = "unmount", e.DEFERRED_UNMOUNT = "deferredUnmount", e;
}(g || {}), _ = 0, v = class {
	mount = [];
	unmount = [];
	deferredUnmount = [];
	parent = null;
	#e = [];
	#t = null;
	#n = !1;
	uid;
	name;
	current = {};
	props = {};
	element;
	provides = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.uid = `${t}.${_++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this.mount) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			h("mount", this, e);
		}
		this.unmount.push(...e);
	};
	onDeferredUnmount = () => (this.#t ||= Promise.all([...this.deferredUnmount.map(async (e) => {
		try {
			await e();
		} catch (e) {
			h("deferredUnmount", this, e);
		}
	}), ...this.#e.map((e) => e.onDeferredUnmount())]).then(() => {}), this.#t);
	onUnmount = () => {
		if (!this.#n) {
			this.#n = !0;
			for (let e of this.unmount) try {
				e();
			} catch (e) {
				h("unmount", this, e);
			}
			for (let e of this.#e) e.onUnmount();
		}
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
	removeChild = async (e) => {
		if (this.#e.indexOf(e) === -1) return;
		await e.onDeferredUnmount();
		let t = this.#e.indexOf(e);
		t !== -1 && (this.#e.splice(t, 1), e.onUnmount(), e.parent = null);
	};
	get childElements() {
		return this.#e.map((e) => e.element);
	}
}, y;
function b(e) {
	if (!y) throw Error(`"${e}" called outside setup() will never be run.`);
	return y;
}
function x(e, t, n = {}) {
	let i = new v(t, e.name), a = y;
	y = i;
	try {
		a && (i.parent = a), i.props = n, i.current = e.setup(t, n) || {};
	} catch (e) {
		throw y = a, r(e) ? e : u("setup", i, e, a, { props: i.props });
	}
	return y = a, i;
}
//#endregion
//#region lib/core/app.ts
var S = class {
	#e = f();
	install = (...e) => (e.forEach(this.#e.install), this);
	component = (e, t = {}) => {
		let n = this.#e.composeComponent(e), r = this.#e.composeMount((e, t) => {
			let r = x(n, e, t);
			return m(e, r), r.onMount(), r;
		}, n, t);
		return (e, t = {}) => r(e, t);
	};
	unmount = (e) => Promise.resolve(this.#e.composeUnmount((e) => this.#t(e))(e));
	async #t(e) {
		let t = e.map((e) => {
			let t = p.get(e);
			return t && p.delete(e), t;
		}).filter((e) => e !== void 0);
		await Promise.all(t.map((e) => e.onDeferredUnmount()));
		for (let e of t) e.onUnmount();
	}
};
function C() {
	return new S();
}
//#endregion
//#region lib/core/component.ts
function w(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function T() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = b("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function E(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return b(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
var D = (e) => {
	b(g.MOUNTED)[g.MOUNTED].push(e);
}, O = (e) => {
	b(g.UNMOUNTED)[g.UNMOUNTED].push(e);
}, k = (e) => {
	b(g.DEFERRED_UNMOUNT)[g.DEFERRED_UNMOUNT].push(e);
};
//#endregion
//#region lib/core/props.ts
function A() {}
//#endregion
//#region lib/core/reactivity.ts
var j = Symbol("watch"), M = null, N = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return M !== null && M.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[j](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, P = (e) => new N(e), F = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[j](e) {
		return this.#e[j](e);
	}
}, I = (e) => new F(e);
function L(e, t) {
	return e[j](t);
}
function R(e, t) {
	O(L(e, t));
}
function z(e) {
	let t = P(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = M, o = /* @__PURE__ */ new Set();
		M = o;
		let s;
		try {
			s = e();
		} finally {
			M = a;
		}
		t.value = s;
		for (let e of o) n.push(e[j](() => {
			i();
		}));
	};
	return i(), O(r), I(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
function B(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function V(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !B(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
var H = class {
	scope;
	getBoundaries;
	#e = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.scope = e, this.getBoundaries = t;
	}
	get(e) {
		if (this.#e.has(e)) return this.#e.get(e) ?? null;
		let t = V(e, this.scope, this.getBoundaries());
		return this.#e.set(e, t), t;
	}
};
function U(e, t) {
	let n = new H(e, t);
	return new Proxy({}, {
		get(e, t) {
			if (!(typeof t == "symbol" || t === "then")) return n.get(t);
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
function W() {
	let e = b("useDomRef");
	return { refs: U(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function G() {
	let e = b("useSlot");
	return {
		addChild(t, n, r) {
			let i = (t) => {
				let i = x(n, t, r);
				return e.addChild(i), i;
			};
			return Array.isArray(t) ? t.map((e) => i(e)) : [i(t)];
		},
		async removeChild(t) {
			await Promise.all(t.map((t) => e.removeChild(t).catch((n) => {
				h("removeChild", t, n, e);
			})));
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function K(e, t, n, r) {
	D(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function q(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	D(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function J(e, t) {
	let n = window.matchMedia(e), r = P(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return D(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: I(r) };
}
//#endregion
export { n as LifecycleError, C as create, T as createContext, e as defineAddon, w as defineComponent, r as isLifecycleError, A as propTypes, I as readonly, P as signal, z as useComputed, k as useDeferredUnmount, W as useDomRef, K as useEvent, q as useIntersectionWatch, J as useMediaQuery, D as useMount, G as useSlot, O as useUnmount, R as useWatch, E as withContext };
