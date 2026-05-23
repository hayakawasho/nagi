//#region lib/core/addon.ts
function e(e) {
	return e;
}
//#endregion
//#region ../addons/scheduler/_internal/pending.ts
function t() {
	let e = /* @__PURE__ */ new Map();
	return {
		add(t) {
			let n = e.get(t);
			n && n.abort();
			let r = new AbortController();
			return e.set(t, r), {
				signal: r.signal,
				complete() {
					return e.get(t) !== r || r.signal.aborted ? !1 : (e.delete(t), !0);
				},
				abort() {
					e.get(t) === r && (r.abort(), e.delete(t));
				}
			};
		},
		abort(t) {
			let n = e.get(t);
			n && (n.abort(), e.delete(t));
		}
	};
}
//#endregion
//#region ../addons/scheduler/_internal/schedule.ts
function n(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
function r(e, t, r) {
	if (r?.aborted) return;
	let { scheduler: a } = globalThis;
	if (typeof a?.postTask == "function") {
		a.postTask(e, {
			priority: t,
			signal: r
		}).catch((e) => {
			n(e) || queueMicrotask(() => {
				throw e;
			});
		});
		return;
	}
	i(e, t, r);
}
function i(e, t, n) {
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
function a(e = {}) {
	let t = e.priority ?? "user-visible";
	return { schedule(e, n = {}) {
		r(e, n.priority ?? t, n.signal);
	} };
}
//#endregion
//#region ../addons/scheduler/index.ts
function o(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
function s(n) {
	return e({
		name: "@usenagi/scheduler",
		install(e) {
			let r = a(n), i = t();
			e.addMountMiddleware((e, t, n) => (t, a) => {
				let s = i.add(t), c = () => {
					r.schedule(() => {
						s.complete() && e(t, a);
					}, {
						priority: n.priority,
						signal: s.signal
					});
				}, { when: l } = n;
				l ? l(t, s.signal).then(() => {
					s.signal.aborted || c();
				}, (e) => {
					o(e) || (s.abort(), queueMicrotask(() => {
						throw e;
					}));
				}) : c();
			}), e.addUnmountMiddleware((e) => (t) => {
				t.forEach(i.abort), e(t);
			});
		}
	});
}
//#endregion
export { s as schedulerAddon };
