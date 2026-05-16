//#region lib/utils/isAbortError.ts
function e(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
//#endregion
//#region lib/addons/scheduler/task.ts
function t(t, r, i) {
	if (i?.aborted) return;
	let { scheduler: a } = globalThis;
	if (typeof a?.postTask == "function") {
		a.postTask(t, {
			priority: r,
			signal: i
		}).catch((t) => {
			e(t) || queueMicrotask(() => {
				throw t;
			});
		});
		return;
	}
	n(t, r, i);
}
function n(e, t, n) {
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
//#region lib/addons/scheduler/index.ts
function r(e = {}) {
	let n = e.priority ?? "user-visible";
	return { schedule(e, r = {}) {
		t(e, r.priority ?? n, r.signal);
	} };
}
//#endregion
export { r as createScheduler };
