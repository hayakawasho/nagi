//#region lib/addons/scheduler.ts
var e = globalThis.scheduler;
function t(e, t, n) {
	let r = t();
	e?.addEventListener("abort", () => n(r), { once: !0 });
}
function n(n = {}) {
	let r = n.default ?? "user-visible";
	return { schedule(n, i = {}) {
		let a = i.priority ?? r, { signal: o } = i;
		if (!o?.aborted) {
			if (typeof e?.postTask == "function") {
				e.postTask(n, {
					priority: a,
					signal: o
				}).catch(() => {});
				return;
			}
			switch (a) {
				case "user-blocking":
					queueMicrotask(() => {
						o?.aborted || n();
					});
					break;
				case "user-visible":
					t(o, () => requestAnimationFrame(() => {
						o?.aborted || n();
					}), cancelAnimationFrame);
					break;
				case "background":
					typeof requestIdleCallback == "function" ? t(o, () => requestIdleCallback(() => {
						o?.aborted || n();
					}), cancelIdleCallback) : t(o, () => setTimeout(() => {
						o?.aborted || n();
					}, 0), clearTimeout);
					break;
			}
		}
	} };
}
//#endregion
export { n as createScheduler };
