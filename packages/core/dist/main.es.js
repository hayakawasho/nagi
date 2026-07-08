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
//#region lib/core/_internal/debugEvents.ts
var c = {
	setup: "[nagi] setup failed",
	mount: "[nagi] onMount hook failed",
	deferredUnmount: "[nagi] useDeferredUnmount hook failed",
	unmount: "[nagi] onUnmount cleanup failed",
	removeChild: "[nagi] removeChild failed"
};
function l(e) {
	console.error(c[e.details.phase], e);
}
function u(e) {
	return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ""}${Array.from(e.classList).map((e) => `.${e}`).join("")}`;
}
function d(e) {
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
		elementLabel: t.element ? u(t.element) : void 0,
		props: t.props,
		cause: t.cause
	};
}
function f(e, t, n, r, a) {
	let o = i.create(e, t, n, r, a), s = t.reporters;
	if (!s || s.length === 0) return l(o), o;
	let c = d(o);
	for (let e of s) try {
		e(c);
	} catch (e) {
		console.error("[nagi] debug reporter failed", e);
	}
	return o;
}
//#endregion
//#region lib/core/_internal/errorReport.ts
function p(e, t, n, r) {
	f(e, t, n, r);
}
//#endregion
//#region lib/core/_internal/component.ts
var m = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "mount", e.UNMOUNTED = "unmount", e.DEFERRED_UNMOUNT = "deferredUnmount", e;
}(m || {}), h = 0, g = class {
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
		this.uid = `${t}.${h++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this.mount) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			p("mount", this, e);
		}
		this.unmount.push(...e);
	};
	onDeferredUnmount = () => (this.#t ||= Promise.all([...this.deferredUnmount.map(async (e) => {
		try {
			await e();
		} catch (e) {
			p("deferredUnmount", this, e);
		}
	}), ...this.#e.map((e) => e.onDeferredUnmount())]).then(() => {}), this.#t);
	onUnmount = () => {
		if (!this.#n) {
			this.#n = !0;
			for (let e of this.unmount) try {
				e();
			} catch (e) {
				p("unmount", this, e);
			}
			for (let e of this.#e) e.onUnmount();
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
}, _, v;
function y() {
	return v;
}
function b(e, t) {
	let n = v;
	v = e;
	try {
		return t();
	} finally {
		v = n;
	}
}
function x(e) {
	if (!_) throw Error(`"${e}" called outside setup() will never be run.`);
	return _;
}
function S(e, t, n = {}, r) {
	let i = new g(t, e.name), o = _;
	i.reporters = r ?? o?.reporters, _ = i;
	try {
		o && (i.parent = o), i.props = n;
		let r = e.setup(t, n);
		if (typeof r == "object" && r && typeof r.then == "function") throw Error(`"${e.name}" setup() must be synchronous. Hooks registered after "await" would be bound to the wrong component.`);
		i.current = r || {};
	} catch (e) {
		throw _ = o, a(e) ? e : f("setup", i, e, o, { props: i.props });
	}
	return _ = o, i;
}
//#endregion
//#region lib/core/app.ts
var C = class {
	#e = n();
	install = (...e) => (e.forEach(this.#e.install), this);
	component = (e, t = {}) => {
		let n = this.#e.composeComponent(e), r = {
			composeComponent: this.#e.composeComponent.bind(this.#e),
			composeUnmount: this.#e.composeUnmount.bind(this.#e)
		}, i = this.#e.composeMount((e, t) => b(r, () => {
			let r = S(n, e, t, this.#e.debugReporters);
			return s(e, r), r.onMount(), r;
		}), n, t);
		return (e, t = {}) => i(e, t);
	};
	unmount = (e) => Promise.resolve(this.#e.composeUnmount((e) => this.#t(e))(e));
	async #t(e) {
		let t = e.map((e) => {
			let t = o.get(e);
			return t && o.delete(e), t;
		}).filter((e) => e !== void 0);
		await Promise.all(t.map((e) => e.onDeferredUnmount()));
		for (let e of t) e.onUnmount();
	}
};
function w() {
	return new C();
}
//#endregion
//#region lib/core/component.ts
function T(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function E() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = x("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function D(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return x(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
var O = (e) => {
	x(m.MOUNTED)[m.MOUNTED].push(e);
}, k = (e) => {
	x(m.UNMOUNTED)[m.UNMOUNTED].push(e);
}, A = (e) => {
	x(m.DEFERRED_UNMOUNT)[m.DEFERRED_UNMOUNT].push(e);
};
//#endregion
//#region lib/core/props.ts
function j() {}
//#endregion
//#region lib/core/reactivity.ts
var M = Symbol("watch"), N = null, P = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return N !== null && N.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[M](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, F = (e) => new P(e), I = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[M](e) {
		return this.#e[M](e);
	}
}, L = (e) => new I(e);
function R(e, t) {
	return e[M](t);
}
function z(e, t) {
	k(R(e, t));
}
function B(e) {
	let t = F(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = N, o = /* @__PURE__ */ new Set();
		N = o;
		let s;
		try {
			s = e();
		} finally {
			N = a;
		}
		t.value = s;
		for (let e of o) n.push(e[M](() => {
			i();
		}));
	};
	return i(), k(r), L(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
function V(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function H(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !V(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
var U = class {
	scope;
	getBoundaries;
	#e = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.scope = e, this.getBoundaries = t;
	}
	get(e) {
		if (this.#e.has(e)) return this.#e.get(e) ?? null;
		let t = H(e, this.scope, this.getBoundaries());
		return this.#e.set(e, t), t;
	}
};
function W(e, t) {
	let n = new U(e, t);
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
function G() {
	let e = x("useDomRef");
	return { refs: W(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function K() {
	let e = x("useSlot"), t = y();
	return {
		addChild(n, r, i) {
			let a = t ? t.composeComponent(r) : r, o = (n) => {
				let r = b(t, () => S(a, n, i));
				return e.addChild(r), r;
			};
			return Array.isArray(n) ? n.map((e) => o(e)) : [o(n)];
		},
		async removeChild(n) {
			let r = async (t) => {
				await Promise.all(n.map((t) => e.removeChild(t).catch((n) => {
					p("removeChild", t, n, e);
				})));
			}, i = n.map((e) => e.element);
			await (t ? t.composeUnmount(r) : r)(i);
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function q(e, t, n, r) {
	O(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function J(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	O(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function Y(e, t) {
	let n = window.matchMedia(e), r = F(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return O(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: L(r) };
}
//#endregion
export { i as LifecycleError, w as create, E as createContext, e as defineAddon, T as defineComponent, a as isLifecycleError, j as propTypes, L as readonly, F as signal, B as useComputed, A as useDeferredUnmount, G as useDomRef, q as useEvent, J as useIntersectionWatch, Y as useMediaQuery, O as useMount, K as useSlot, k as useUnmount, z as useWatch, D as withContext };
