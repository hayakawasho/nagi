import { defineAddon as e } from "@usenagi/core";
//#region ../addons/scheduler/_internal/deferredMounts.ts
var t = class {
	#e = /* @__PURE__ */ new Map();
	add(e) {
		this.#n(e, this.#e.get(e));
		let t = new AbortController();
		return this.#e.set(e, t), {
			signal: t.signal,
			complete: () => this.#t(e, t),
			abort: () => this.#n(e, t)
		};
	}
	abort = (e) => {
		this.#n(e, this.#e.get(e));
	};
	#t(e, t) {
		let n = this.#e.get(e) !== t, r = t.signal.aborted;
		return n || r ? !1 : (this.#e.delete(e), !0);
	}
	#n(e, t) {
		!t || this.#e.get(e) !== t || (t.abort(), this.#e.delete(e));
	}
};
function n() {
	return new t();
}
//#endregion
//#region ../addons/scheduler/_internal/isAbortError.ts
function r(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
//#endregion
//#region ../addons/scheduler/_internal/schedule.ts
function i(e, t, n) {
	if (n?.aborted) return;
	let { scheduler: i } = globalThis;
	if (typeof i?.postTask == "function") {
		i.postTask(e, {
			priority: t,
			signal: n
		}).catch((e) => {
			r(e) || queueMicrotask(() => {
				throw e;
			});
		});
		return;
	}
	a(e, t, n);
}
function a(e, t, n) {
	function r() {
		n?.aborted || e();
	}
	function i(e, t) {
		let r = e();
		n?.addEventListener("abort", () => t(r), { once: !0 });
	}
	switch (t) {
		case "user-blocking":
			queueMicrotask(r);
			break;
		case "user-visible":
			i(() => requestAnimationFrame(r), cancelAnimationFrame);
			break;
		case "background":
			typeof requestIdleCallback == "function" ? i(() => requestIdleCallback(r), cancelIdleCallback) : i(() => setTimeout(r, 0), clearTimeout);
			break;
	}
}
function o(e = {}) {
	let t = e.priority ?? "user-visible";
	return { schedule(e, n = {}) {
		i(e, n.priority ?? t, n.signal);
	} };
}
//#endregion
//#region ../addons/scheduler/index.ts
function s(t) {
	return e({
		name: "@usenagi/scheduler",
		install(e) {
			let i = o(t), a = n(), s = (t, n, r, i) => {
				e.emitDebugEvent({
					version: 1,
					level: "info",
					source: "scheduler",
					phase: t,
					name: n,
					element: r,
					cueLabel: i
				});
			};
			e.addMountMiddleware((e, t, n) => (o, c) => {
				let l = a.add(o), u = () => {
					i.schedule(() => {
						l.complete() && e(o, c);
					}, {
						priority: n.priority,
						signal: l.signal
					});
				}, { when: d } = n;
				if (d) {
					let e = d.cueLabel ?? "custom";
					s("pending", t.name, o, e), l.signal.addEventListener("abort", () => s("aborted", t.name, o, e), { once: !0 }), d(o, l.signal).then(() => {
						l.signal.aborted || (s("resolved", t.name, o, e), u());
					}, (e) => {
						r(e) || (l.abort(), queueMicrotask(() => {
							throw e;
						}));
					});
				} else u();
			}), e.addUnmountMiddleware((e) => (t) => (t.forEach(a.abort), e(t)));
		}
	});
}
//#endregion
export { s as schedulerAddon };
