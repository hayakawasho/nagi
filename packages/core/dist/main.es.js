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
};
function a(e) {
	console.error(i[e.details.phase], e);
}
function o(e) {
	return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ""}${Array.from(e.classList).map((e) => `.${e}`).join("")}`;
}
function s(e) {
	let { details: t } = e;
	return {
		version: 1,
		level: "error",
		source: "lifecycle",
		phase: t.phase,
		name: t.name,
		uid: t.uid,
		path: t.path,
		parentUid: t.parentUid,
		element: t.element,
		elementLabel: t.element ? o(t.element) : void 0,
		props: t.props,
		cause: t.cause
	};
}
function c(e, t) {
	if (!(!e || e.length === 0)) for (let n of e) try {
		n(t);
	} catch (e) {
		console.error("[nagi] debug reporter failed", e);
	}
}
function l(e, t, r, i, o) {
	let l = n.create(e, t, r, i, o), u = t.reporters;
	return !u || u.length === 0 ? (a(l), l) : (c(u, s(l)), l);
}
function u(e, t) {
	let n = t.reporters;
	!n || n.length === 0 || c(n, {
		version: 1,
		level: "info",
		source: "lifecycle",
		phase: e,
		name: t.name,
		uid: t.uid,
		parentUid: t.parent?.uid,
		element: t.element,
		elementLabel: o(t.element)
	});
}
//#endregion
//#region lib/core/_internal/addonRegistry.ts
var d = class {
	#e = /* @__PURE__ */ new Set();
	#t = [];
	#n = [];
	#r = [];
	#i = [];
	get installedAddons() {
		return this.#e;
	}
	get debugReporters() {
		return this.#i;
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
	addDebugReporter(e) {
		this.#i.push(e);
	}
	emitDebugEvent(e) {
		if (this.#i.length === 0) return;
		let t = e.element && !e.elementLabel ? {
			...e,
			elementLabel: o(e.element)
		} : e;
		c(this.#i, t);
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
	l(e, t, n, r);
}
function g(e, t) {
	u(e, t);
}
//#endregion
//#region lib/core/_internal/component.ts
var _ = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "mount", e.UNMOUNTED = "unmount", e.DEFERRED_UNMOUNT = "deferredUnmount", e;
}(_ || {}), v = 0, y = class {
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
	reporters;
	constructor(e, t) {
		this.uid = `${t}.${v++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this.mount) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			h("mount", this, e);
		}
		this.unmount.push(...e), g("mount", this);
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
			g("unmount", this);
		}
	};
	addChild = (e) => {
		this.#e.push(e), e.parent = this, e.reporters ??= this.reporters;
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
}, b, x;
function S() {
	return x;
}
function C(e, t) {
	let n = x;
	x = e;
	try {
		return t();
	} finally {
		x = n;
	}
}
function w(e) {
	if (!b) throw Error(`"${e}" called outside setup() will never be run.`);
	return b;
}
function T(e, t, n = {}, i) {
	let a = new y(t, e.name), o = b;
	a.reporters = i ?? o?.reporters, b = a;
	try {
		o && (a.parent = o), a.props = n;
		let r = e.setup(t, n);
		if (typeof r == "object" && r && typeof r.then == "function") throw Error(`"${e.name}" setup() must be synchronous. Hooks registered after "await" would be bound to the wrong component.`);
		a.current = r || {};
	} catch (e) {
		throw b = o, r(e) ? e : l("setup", a, e, o, { props: a.props });
	}
	return b = o, a;
}
//#endregion
//#region lib/core/app.ts
var E = class {
	#e = f();
	install = (...e) => (e.forEach(this.#e.install), this);
	component = (e, t = {}) => {
		let n = this.#e.composeComponent(e), r = {
			composeComponent: this.#e.composeComponent.bind(this.#e),
			composeUnmount: this.#e.composeUnmount.bind(this.#e)
		}, i = this.#e.composeMount((e, t) => C(r, () => {
			let r = T(n, e, t, this.#e.debugReporters);
			return m(e, r), r.onMount(), r;
		}), n, t);
		return (e, t = {}) => i(e, t);
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
function D() {
	return new E();
}
//#endregion
//#region lib/core/component.ts
function O(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function k() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = w("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function A(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return w(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
var j = (e) => {
	w(_.MOUNTED)[_.MOUNTED].push(e);
}, M = (e) => {
	w(_.UNMOUNTED)[_.UNMOUNTED].push(e);
}, N = (e) => {
	w(_.DEFERRED_UNMOUNT)[_.DEFERRED_UNMOUNT].push(e);
};
//#endregion
//#region lib/core/props.ts
function P() {}
//#endregion
//#region lib/core/reactivity.ts
var F = Symbol("watch"), I = null, L = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return I !== null && I.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[F](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, R = (e) => new L(e), z = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[F](e) {
		return this.#e[F](e);
	}
}, B = (e) => new z(e);
function V(e, t) {
	return e[F](t);
}
function H(e, t) {
	M(V(e, t));
}
function U(e) {
	let t = R(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = I, o = /* @__PURE__ */ new Set();
		I = o;
		let s;
		try {
			s = e();
		} finally {
			I = a;
		}
		t.value = s;
		for (let e of o) n.push(e[F](() => {
			i();
		}));
	};
	return i(), M(r), B(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
function W(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function G(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !W(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
var K = class {
	scope;
	getBoundaries;
	#e = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.scope = e, this.getBoundaries = t;
	}
	get(e) {
		if (this.#e.has(e)) return this.#e.get(e) ?? null;
		let t = G(e, this.scope, this.getBoundaries());
		return this.#e.set(e, t), t;
	}
};
function q(e, t) {
	let n = new K(e, t);
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
function J() {
	let e = w("useDomRef");
	return { refs: q(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function Y() {
	let e = w("useSlot"), t = S();
	return {
		addChild(n, r, i) {
			let a = t ? t.composeComponent(r) : r, o = (n) => {
				let r = C(t, () => T(a, n, i));
				return e.addChild(r), r;
			};
			return Array.isArray(n) ? n.map((e) => o(e)) : [o(n)];
		},
		async removeChild(n) {
			let r = async (t) => {
				await Promise.all(n.map((t) => e.removeChild(t).catch((n) => {
					h("removeChild", t, n, e);
				})));
			}, i = n.map((e) => e.element);
			await (t ? t.composeUnmount(r) : r)(i);
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function X(e, t, n, r) {
	j(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function Z(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	j(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function Q(e, t) {
	let n = window.matchMedia(e), r = R(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return j(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: B(r) };
}
//#endregion
export { n as LifecycleError, D as create, k as createContext, e as defineAddon, O as defineComponent, r as isLifecycleError, P as propTypes, B as readonly, R as signal, U as useComputed, N as useDeferredUnmount, J as useDomRef, X as useEvent, Z as useIntersectionWatch, Q as useMediaQuery, j as useMount, Y as useSlot, M as useUnmount, H as useWatch, A as withContext };
