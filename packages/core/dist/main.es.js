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
//#region lib/core/_internal/errorReporter.ts
var c = {
	setup: "[nagi] setup failed",
	mount: "[nagi] onMount hook failed",
	deferredUnmount: "[nagi] useDeferredUnmount hook failed",
	unmount: "[nagi] onUnmount cleanup failed",
	removeChild: "[nagi] removeChild failed"
};
function l(e, t, n, r) {
	console.error(c[e], i.create(e, t, n, r));
}
//#endregion
//#region lib/core/_internal/component.ts
var u = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "mount", e.UNMOUNTED = "unmount", e.DEFERRED_UNMOUNT = "deferredUnmount", e;
}(u || {}), d = 0, f = class {
	mount = [];
	unmount = [];
	deferredUnmount = [];
	parent = null;
	#e = [];
	#t = null;
	uid;
	name;
	current = {};
	props = {};
	element;
	provides = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.uid = `${t}.${d++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this.mount) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			l("mount", this, e);
		}
		this.unmount.push(...e);
	};
	onDeferredUnmount = () => (this.#t ||= Promise.all([...this.deferredUnmount.map(async (e) => {
		try {
			await e();
		} catch (e) {
			l("deferredUnmount", this, e);
		}
	}), ...this.#e.map((e) => e.onDeferredUnmount())]).then(() => {}), this.#t);
	onUnmount = () => {
		for (let e of this.unmount) try {
			e();
		} catch (e) {
			l("unmount", this, e);
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
	removeChild = async (e) => {
		let t = this.#e.indexOf(e);
		t !== -1 && (await e.onDeferredUnmount(), this.#e.splice(t, 1), e.parent = null, e.onUnmount());
	};
	get childElements() {
		return this.#e.map((e) => e.element);
	}
}, p;
function m(e) {
	if (!p) throw Error(`"${e}" called outside setup() will never be run.`);
	return p;
}
function h(e, t, n = {}) {
	let r = new f(t, e.name), o = p;
	p = r;
	try {
		o && (r.parent = o), r.props = n, r.current = e.setup(t, n) || {};
	} catch (e) {
		throw p = o, a(e) ? e : i.create("setup", r, e, o, { props: r.props });
	}
	return p = o, r;
}
//#endregion
//#region lib/core/app.ts
var g = class {
	#e = n();
	install = (...e) => (e.forEach(this.#e.install), this);
	component = (e, t = {}) => {
		let n = this.#e.composeComponent(e), r = this.#e.composeMount((e, t) => {
			let r = h(n, e, t);
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
function _() {
	return new g();
}
//#endregion
//#region lib/core/component.ts
function v(e) {
	return e;
}
//#endregion
//#region lib/core/context.ts
function y() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = m("createContext.use");
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function b(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return m(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/lifecycle.ts
var x = (e) => {
	m(u.MOUNTED)[u.MOUNTED].push(e);
}, S = (e) => {
	m(u.UNMOUNTED)[u.UNMOUNTED].push(e);
}, C = (e) => {
	m(u.DEFERRED_UNMOUNT)[u.DEFERRED_UNMOUNT].push(e);
};
//#endregion
//#region lib/core/props.ts
function w() {}
//#endregion
//#region lib/core/reactivity.ts
var T = Symbol("watch"), E = null, D = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return E !== null && E.add(this), this.#e;
	}
	set value(e) {
		if (Object.is(e, this.#e)) return;
		let t = this.#e;
		this.#e = e;
		for (let n of Array.from(this.#t)) n(e, t);
	}
	[T](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, O = (e) => new D(e), k = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
	[T](e) {
		return this.#e[T](e);
	}
}, A = (e) => new k(e);
function j(e, t) {
	return e[T](t);
}
function M(e, t) {
	S(j(e, t));
}
function N(e) {
	let t = O(void 0), n = [], r = () => {
		n.forEach((e) => {
			e();
		}), n = [];
	}, i = () => {
		r();
		let a = E, o = /* @__PURE__ */ new Set();
		E = o;
		let s;
		try {
			s = e();
		} finally {
			E = a;
		}
		t.value = s;
		for (let e of o) n.push(e[T](() => {
			i();
		}));
	};
	return i(), S(r), A(t);
}
//#endregion
//#region lib/hooks/core/useDomRef.ts
function P(e, t) {
	return t.some((t) => t !== e && t.contains(e));
}
function F(e, t, n) {
	let r = `[data-ref="${CSS.escape(e)}"]`, i = Array.from(t.querySelectorAll(r)).filter((e) => !P(e, n));
	return i.length === 0 ? null : i.length === 1 ? i[0] : i;
}
function I(e, t) {
	let n = /* @__PURE__ */ new Map();
	return new Proxy({}, {
		get(r, i) {
			if (typeof i == "symbol" || i === "then") return;
			if (n.has(i)) return n.get(i);
			let a = F(i, e, t());
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
function L() {
	let e = m("useDomRef");
	return { refs: I(e.element, () => e.childElements) };
}
//#endregion
//#region lib/hooks/core/useSlot.ts
function R() {
	let e = m("useSlot");
	return {
		addChild(t, n, r) {
			let i = (t) => {
				let i = h(n, t, r);
				return e.addChild(i), i;
			};
			return Array.isArray(t) ? t.map((e) => i(e)) : [i(t)];
		},
		async removeChild(t) {
			await Promise.all(t.map((t) => e.removeChild(t).catch((n) => {
				l("removeChild", t, n, e);
			})));
		}
	};
}
//#endregion
//#region lib/hooks/useEvent.ts
function z(e, t, n, r) {
	x(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/hooks/useIntersectionWatch.ts
function B(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	x(() => (i(e), () => {
		r.disconnect();
	}));
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/hooks/useMediaQuery.ts
function V(e, t) {
	let n = window.matchMedia(e), r = O(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return x(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: A(r) };
}
//#endregion
export { i as LifecycleError, _ as create, y as createContext, e as defineAddon, v as defineComponent, a as isLifecycleError, w as propTypes, A as readonly, O as signal, N as useComputed, C as useDeferredUnmount, L as useDomRef, z as useEvent, B as useIntersectionWatch, V as useMediaQuery, x as useMount, R as useSlot, S as useUnmount, M as useWatch, b as withContext };
