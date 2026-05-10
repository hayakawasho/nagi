//#region lib/addons/cue/index.ts
function e() {
	return new DOMException("aborted", "AbortError");
}
function t(t) {
	return (n, r) => new Promise((i, a) => {
		if (r.aborted) {
			a(e());
			return;
		}
		let o = new IntersectionObserver((e) => {
			for (let t of e) if (t.isIntersecting) {
				o.disconnect(), i();
				return;
			}
		}, t);
		o.observe(n), r.addEventListener("abort", () => {
			o.disconnect(), a(e());
		}, { once: !0 });
	});
}
function n(t) {
	return (n, r) => new Promise((n, i) => {
		if (r.aborted) {
			i(e());
			return;
		}
		if (typeof requestIdleCallback != "function") {
			let a = setTimeout(() => n(), t ?? 0);
			r.addEventListener("abort", () => {
				clearTimeout(a), i(e());
			}, { once: !0 });
			return;
		}
		let a = requestIdleCallback(() => n(), t == null ? void 0 : { timeout: t });
		r.addEventListener("abort", () => {
			cancelIdleCallback(a), i(e());
		}, { once: !0 });
	});
}
function r(t) {
	return (n, r) => new Promise((n, i) => {
		if (r.aborted) {
			i(e());
			return;
		}
		let a = matchMedia(t);
		if (a.matches) {
			n();
			return;
		}
		let o = () => {
			a.matches && (a.removeEventListener("change", o), n());
		};
		a.addEventListener("change", o), r.addEventListener("abort", () => {
			a.removeEventListener("change", o), i(e());
		}, { once: !0 });
	});
}
function i(t = [
	"click",
	"focus",
	"pointerenter"
]) {
	return (n, r) => new Promise((i, a) => {
		if (r.aborted) {
			a(e());
			return;
		}
		let o = () => {
			for (let e of t) n.removeEventListener(e, s);
		}, s = () => {
			o(), i();
		};
		for (let e of t) n.addEventListener(e, s, { once: !0 });
		r.addEventListener("abort", () => {
			o(), a(e());
		}, { once: !0 });
	});
}
//#endregion
export { n as idle, i as interaction, r as media, t as visible };
