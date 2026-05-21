//#region lib/core/addon.ts
function e(e) {
	return e;
}
//#endregion
//#region lib/utils/isAbortError.ts
function t(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
//#endregion
//#region lib/addons/scheduler/pending.ts
function n() {
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
//#region lib/addons/scheduler/task.ts
function r(e, n, r) {
	if (r?.aborted) return;
	let { scheduler: a } = globalThis;
	if (typeof a?.postTask == "function") {
		a.postTask(e, {
			priority: n,
			signal: r
		}).catch((e) => {
			t(e) || queueMicrotask(() => {
				throw e;
			});
		});
		return;
	}
	i(e, n, r);
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
//#endregion
//#region lib/addons/scheduler/scheduler.ts
function a(e = {}) {
	let t = e.priority ?? "user-visible";
	return { schedule(e, n = {}) {
		r(e, n.priority ?? t, n.signal);
	} };
}
//#endregion
//#region lib/addons/scheduler/addon.ts
function o(r) {
	return e({
		name: "@usenagi/scheduler",
		install(e) {
			let i = a(r), o = n();
			e.addMountMiddleware((e, n, r) => (n, a) => {
				let s = o.add(n), c = () => {
					i.schedule(() => {
						s.complete() && e(n, a);
					}, {
						priority: r.priority,
						signal: s.signal
					});
				}, { when: l } = r;
				l ? l(n, s.signal).then(() => {
					s.signal.aborted || c();
				}, (e) => {
					t(e) || (s.abort(), queueMicrotask(() => {
						throw e;
					}));
				}) : c();
			}), e.addUnmountMiddleware((e) => (t) => {
				t.forEach(o.abort), e(t);
			});
		}
	});
}
//#endregion
export { a as createScheduler, o as schedulerAddon };
