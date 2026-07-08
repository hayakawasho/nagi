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
}, _;
function v(e) {
	if (!_) throw Error(`"${e}" called outside setup() will never be run.`);
	return _;
}
function y(e, t, n = {}, r) {
	let i = new g(t, e.name), o = _;
	i.reporters = r ?? o?.reporters, _ = i;
	try {
		o && (i.parent = o), i.props = n, i.current = e.setup(t, n) || {};
	} catch (e) {
		throw _ = o, a(e) ? e : f("setup", i, e, o, { props: i.props });
	}
	return _ = o, i;
}
//#endregion
//#region lib/core/app.ts
var b = class {
	#e = n();
	install = (...e) => (e.forEach(this.#e.install), this);
	component = (e, t = {}) => {
		let n = this.#e.composeComponent(e), r = this.#e.composeMount((e, t) => {
			let r = y(n, e, t, this.#e.debugReporters);
			return s(e, r), r.onMount(), r;
		}, n, t);
		return (e, t = {}) => r(e, t);
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
function x() {
	return new b();
}
//#endregion
//#region lib/core/component.ts
function S(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function C() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = v("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function w(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return v(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
var T = (e) => {
	v(m.MOUNTED)[m.MOUNTED].push(e);
}, E = (e) => {
	v(m.UNMOUNTED)[m.UNMOUNTED].push(e);
}, D = (e) => {
	v(m.DEFERRED_UNMOUNT)[m.DEFERRED_UNMOUNT].push(e);
};
//#endregion
//#region lib/core/props.ts
function O() {}
//#endregion
//#region lib/core/reactivity.ts
var k = Symbol("watch"), A = null, j = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return A !== null && A.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[k](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, M = (e) => new j(e), N = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[k](e) {
		return this.#e[k](e);
	}
}, P = (e) => new N(e);
function F(e, t) {
	return e[k](t);
}
function I(e, t) {
	E(F(e, t));
}
function L(e) {
	let t = M(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = A, o = /* @__PURE__ */ new Set();
		A = o;
		let s;
		try {
			s = e();
		} finally {
			A = a;
		}
		t.value = s;
		for (let e of o) n.push(e[k](() => {
			i();
		}));
	};
	return i(), E(r), P(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
function R(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function z(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !R(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
var B = class {
	scope;
	getBoundaries;
	#e = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.scope = e, this.getBoundaries = t;
	}
	get(e) {
		if (this.#e.has(e)) return this.#e.get(e) ?? null;
		let t = z(e, this.scope, this.getBoundaries());
		return this.#e.set(e, t), t;
	}
};
function V(e, t) {
	let n = new B(e, t);
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
function H() {
	let e = v("useDomRef");
	return { refs: V(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function U() {
	let e = v("useSlot");
	return {
		addChild(t, n, r) {
			let i = (t) => {
				let i = y(n, t, r);
				return e.addChild(i), i;
			};
			return Array.isArray(t) ? t.map((e) => i(e)) : [i(t)];
		},
		async removeChild(t) {
			await Promise.all(t.map((t) => e.removeChild(t).catch((n) => {
				p("removeChild", t, n, e);
			})));
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function W(e, t, n, r) {
	T(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function G(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	T(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function K(e, t) {
	let n = window.matchMedia(e), r = M(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return T(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: P(r) };
}
//#endregion
export { i as LifecycleError, x as create, C as createContext, e as defineAddon, S as defineComponent, a as isLifecycleError, O as propTypes, P as readonly, M as signal, L as useComputed, D as useDeferredUnmount, H as useDomRef, W as useEvent, G as useIntersectionWatch, K as useMediaQuery, T as useMount, U as useSlot, E as useUnmount, I as useWatch, w as withContext };
