//#region lib/util/assert.ts
function e(e, t) {
	if (!e) throw Error(t || "unexpected condition");
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
//#region lib/core/lifecycle.ts
var i = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "Mounted", e.UNMOUNTED = "Unmounted", e;
}({});
function a(e) {
	return (t) => {
		l(e)[e].push(t);
	};
}
var o = a(i.MOUNTED), s = a(i.UNMOUNTED), c;
function l(t) {
	return e(c, `"${t}" called outside setup() will never be run.`), c;
}
var u = 0, d = class {
	[i.MOUNTED] = [];
	[i.UNMOUNTED] = [];
	parent = null;
	#e = [];
	uid;
	name;
	current = {};
	props = {};
	element;
	provides = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.uid = `${t}.${u++}`, this.name = t, this.element = e;
	}
	onMount = () => {
		let e = [];
		for (let t of this[i.MOUNTED]) try {
			let n = t();
			typeof n == "function" && e.push(n);
		} catch (e) {
			console.error("[Lake] onMount hook failed", n.create("mount", this, e));
		}
		this[i.UNMOUNTED].push(...e);
	};
	onUnmount = () => {
		for (let e of this[i.UNMOUNTED]) try {
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
};
function f(e, t, i) {
	let a = c, o = new d(t, e.name);
	a && (o.parent = a), c = o, o.props = i;
	try {
		o.current = e.setup(t, i) || {};
	} catch (e) {
		throw r(e) ? e : n.create("setup", o, e, a, { props: o.props });
	} finally {
		c = a;
	}
	return o;
}
//#endregion
//#region lib/composition/createContext.ts
function p() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = l("createContext.use").parent;
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function m(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return l(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/internal/dom-refs.ts
function h(e, t) {
	let n = (e) => {
		let n = t ?? document, r = Array.from(n.querySelectorAll(`[data-ref="${e}"]`)), { length: i } = r;
		return i === 0 ? null : { 1: r[0] }[i] ?? r;
	};
	return [...e].reduce((e, t) => (e[t] = n(t), e), {});
}
//#endregion
//#region lib/composition/useDomRef.ts
function g(...e) {
	let t = l("useDomRef");
	return { refs: h(new Set(e), t.element) };
}
//#endregion
//#region lib/composition/useEvent.ts
function _(e, t, n, r) {
	o(() => (e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	}));
}
//#endregion
//#region lib/composition/useIntersectionWatch.ts
function v(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function i(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	i(e), s(() => {
		r.disconnect();
	});
	function a(e) {
		r.unobserve(e);
	}
	return { unwatch: a };
}
//#endregion
//#region lib/core/ref.ts
var y = Symbol("watch"), b = class {
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
	[y](e) {
		return this.#t.add(e), () => {
			this.#t.delete(e);
		};
	}
}, x = (e) => new b(e), S = class {
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
}, C = (e) => new S(e);
function w(e, t) {
	return e[y](t);
}
function T(e, t) {
	s(w(e, t));
}
//#endregion
//#region lib/composition/useMediaQuery.ts
function E(e, t) {
	let n = window.matchMedia(e), r = x(n.matches), i = null;
	function a(e) {
		r.value = e.matches, e.matches ? i = t() : (i?.(), i = null);
	}
	return o(() => (n.addEventListener("change", a), n.matches && (i = t()), () => {
		i?.(), n.removeEventListener("change", a);
	})), { matchesQuery: C(r) };
}
//#endregion
//#region lib/composition/useRootRef.ts
function D() {
	return l("useRootRef").element;
}
//#endregion
//#region lib/composition/useSlot.ts
function O() {
	let e = l("useSlot");
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
//#region lib/core/core.ts
var k = /* @__PURE__ */ new WeakMap();
function A(e, t) {
	if (k.has(e)) {
		let r = k.get(e);
		throw n.create("mount", t, /* @__PURE__ */ Error(`Component "${r.name}" (${r.uid}) is already mounted on this element`), r);
	}
	k.set(e, t);
}
function j() {
	return {
		component(e) {
			return (t, n = {}) => {
				let r = f(e, t, n);
				return A(t, r), r.onMount(), r;
			};
		},
		unmount(e) {
			e.filter((e) => k.has(e)).forEach((e) => {
				k.get(e).onUnmount(), k.delete(e);
			});
		}
	};
}
function M(e) {
	return e === void 0 ? (e) => (t) => ({
		name: e.name,
		setup(n) {
			return e.setup(n, t);
		}
	}) : e;
}
//#endregion
export { n as LifecycleError, j as create, p as createContext, M as defineComponent, r as isLifecycleError, C as readonly, x as ref, g as useDomRef, _ as useEvent, v as useIntersectionWatch, E as useMediaQuery, o as useMount, D as useRootRef, O as useSlot, s as useUnmount, T as useWatch, m as withContext };
