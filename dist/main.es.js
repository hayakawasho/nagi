//#region lib/util/assert.ts
function e(e, t) {
	if (!e) throw Error(t || "unexpected condition");
}
//#endregion
//#region lib/core/lifecycle.ts
var t = /* @__PURE__ */ function(e) {
	return e.MOUNTED = "Mounted", e.UNMOUNTED = "Unmounted", e;
}({});
function n(e) {
	return (t) => {
		s(e)[e].push(t);
	};
}
var r = n(t.MOUNTED), i = n(t.UNMOUNTED), a;
function o(e) {
	return a = e, e;
}
function s(t) {
	return e(a, `"${t}" called outside setup() will never be run.`), a;
}
var c = 0, l = class {
	[t.MOUNTED] = [];
	[t.UNMOUNTED] = [];
	parent = null;
	#e = [];
	uid;
	current = {};
	props = {};
	element;
	provides = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.uid = `${t}.${c++}`, this.element = e;
	}
	onMount = () => {
		let e = this[t.MOUNTED].map((e) => e()).filter((e) => typeof e == "function");
		this[t.UNMOUNTED].push(...e);
	};
	onUnmount = () => {
		[...this[t.UNMOUNTED], ...this.#e.flatMap((e) => e.onUnmount)].forEach((e) => {
			e();
		});
	};
	addChild = (e) => {
		this.#e.push(e), e.parent = this, e.onMount();
	};
	removeChild = (e) => {
		let t = this.#e.indexOf(e);
		t !== -1 && (this.#e.splice(t, 1), e.parent = null, e.onUnmount());
	};
};
function u(e) {
	let t = a;
	return (n, r) => {
		let i = new l(n, e.name);
		t && (i.parent = t);
		let a = o(i);
		return a.props = r || {}, a.current = e.setup(n, r) || {}, o(t), a;
	};
}
//#endregion
//#region lib/composition/createContext.ts
function d() {
	let e = Symbol();
	return [{ _id: e }, () => {
		let t = s("createContext.use").parent;
		for (; t !== null;) {
			if (t.provides.has(e)) return t.provides.get(e);
			t = t.parent;
		}
		throw Error("createContext.use: no provider found");
	}];
}
function f(e, t) {
	return (n) => ({
		name: n.name,
		setup(r, i) {
			return s(`withContext.${n.name}`).provides.set(e._id, t), n.setup(r, i);
		}
	});
}
//#endregion
//#region lib/core/internal/dom-refs.ts
function p(e, t) {
	let n = (e) => {
		let n = t ?? document, r = Array.from(n.querySelectorAll(`[data-ref="${e}"]`)), { length: i } = r;
		return i === 0 ? null : { 1: r[0] }[i] ?? r;
	};
	return [...e].reduce((e, t) => (e[t] = n(t), e), {});
}
//#endregion
//#region lib/composition/useDomRef.ts
function m(...e) {
	let t = s("useDomRef");
	return { refs: p(new Set(e), t.element) };
}
//#endregion
//#region lib/composition/useEvent.ts
function h(e, t, n, i) {
	r(() => (e.addEventListener(t, n, i), () => {
		e.removeEventListener(t, n, i);
	}));
}
//#endregion
//#region lib/composition/useIntersectionWatch.ts
function g(e, t, n = {
	rootMargin: "0px",
	threshold: .1
}) {
	let r = new IntersectionObserver(t, n);
	function a(e) {
		Array.isArray(e) ? e.forEach((e) => {
			r.observe(e);
		}) : r.observe(e);
	}
	a(e), i(() => {
		r.disconnect();
	});
	function o(e) {
		r.unobserve(e);
	}
	return { unwatch: o };
}
//#endregion
//#region lib/core/ref.ts
var _ = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e;
	}
	set value(e) {
		this.#e = e;
	}
}, v = (e) => new _(e), y = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	get value() {
		return this.#e.value;
	}
}, b = (e) => new y(e);
//#endregion
//#region lib/composition/useMediaQuery.ts
function x(e, t) {
	let n = window.matchMedia(e), i = v(n.matches), a = null;
	function o(e) {
		i.value = e.matches, e.matches ? a = t() : (a?.(), a = null);
	}
	return n.addEventListener("change", o), r(() => (n.matches && (a = t()), () => {
		a?.(), n.removeEventListener("change", o);
	})), { matchesQuery: b(i) };
}
//#endregion
//#region lib/composition/useRootRef.ts
function S() {
	return s("useRootRef").element;
}
//#endregion
//#region lib/composition/useSlot.ts
function C() {
	let e = s("useSlot");
	return {
		addChild(t, n, r = {}) {
			let i = (t) => {
				let i = u(n)(t, r);
				return e.addChild(i), i;
			};
			return Array.isArray(t) ? t.map((e) => i(e)) : [i(t)];
		},
		removeChild(t) {
			t.forEach((t) => {
				e.removeChild(t);
			});
		}
	};
}
//#endregion
//#region lib/core/core.ts
var w = /* @__PURE__ */ new WeakMap();
function T(e, t, n) {
	if (w.has(e)) throw Error(JSON.stringify({
		payload: {
			el: e,
			component: t,
			name: n
		},
		reason: ""
	}));
	try {
		w.set(e, t);
	} catch {
		throw Error(JSON.stringify({
			payload: {
				el: e,
				component: t,
				name: n
			},
			reason: ""
		}));
	}
}
function E() {
	return {
		component(e) {
			return (t, n = {}) => {
				let r = u(e)(t, n);
				return T(t, r, e.name), r.onMount(), r;
			};
		},
		unmount(e) {
			e.filter((e) => w.has(e)).forEach((e) => {
				w.get(e).onUnmount();
			});
		}
	};
}
function D(e) {
	return e === void 0 ? (e) => (t) => ({
		name: e.name,
		setup(n) {
			return e.setup(n, t);
		}
	}) : e;
}
//#endregion
export { E as create, d as createContext, D as defineComponent, b as readonly, v as ref, m as useDomRef, h as useEvent, g as useIntersectionWatch, x as useMediaQuery, r as useMount, S as useRootRef, C as useSlot, i as useUnmount, f as withContext };
