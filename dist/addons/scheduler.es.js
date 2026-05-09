//#region lib/utils/isAbortError.ts
function e(e) {
	return (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
}
//#endregion
//#region lib/addons/scheduler/task.ts
function t(e, t) {
	t?.aborted || e();
}
function n(e, t, n) {
	let r = t();
	e?.addEventListener("abort", () => n(r), { once: !0 });
}
function r(t, n, r) {
	let { scheduler: i } = globalThis;
	return typeof i?.postTask == "function" ? (i.postTask(t, {
		priority: n,
		signal: r
	}).catch((t) => {
		e(t) || queueMicrotask(() => {
			throw t;
		});
	}), !0) : !1;
}
function i(e, r, i) {
	switch (r) {
		case "user-blocking":
			queueMicrotask(() => t(e, i));
			break;
		case "user-visible":
			n(i, () => requestAnimationFrame(() => t(e, i)), cancelAnimationFrame);
			break;
		case "background":
			typeof requestIdleCallback == "function" ? n(i, () => requestIdleCallback(() => t(e, i)), cancelIdleCallback) : n(i, () => setTimeout(() => t(e, i), 0), clearTimeout);
			break;
	}
}
function a(e, t, n) {
	n?.aborted || r(e, t, n) || i(e, t, n);
}
//#endregion
//#region lib/addons/scheduler/index.ts
function o(e = {}) {
	let t = e.default ?? "user-visible";
	return { schedule(e, n = {}) {
		a(e, n.priority ?? t, n.signal);
	} };
}
//#endregion
export { o as createScheduler };
