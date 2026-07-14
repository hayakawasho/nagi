import { defineAddon as e } from "@usenagi/core";
//#region ../addons/debug/index.ts
function t(e) {
	return e instanceof Error ? {
		name: e.name,
		message: e.message,
		stack: e.stack
	} : { message: String(e) };
}
function n(e, t) {
	if (!e.cueLabel) return t;
	switch (e.phase) {
		case "pending": return `${t} waiting: ${e.cueLabel}`;
		case "resolved":
		case "aborted": return `${t} cue: ${e.cueLabel}`;
	}
}
function r(e) {
	let r = e.path ?? e.name, i = e.uid ? ` (${e.uid})` : "", a = e.elementLabel ? ` <${e.elementLabel}>` : "", o = `[nagi:debug] ${e.level}:${e.source}:${e.phase} ${r}${i}${a}`;
	if (e.level === "info") return e.source === "scheduler" ? n(e, o) : o;
	let s = t(e.cause);
	return `${o}: ${[s.name, s.message].filter(Boolean).join(": ")}`;
}
function i() {
	return e({
		name: "@usenagi/debug",
		install(e) {
			e.addDebugReporter((e) => {
				if (e.level === "info") {
					console.info(r(e));
					return;
				}
				console.error(r(e), e.cause);
			});
		}
	});
}
//#endregion
export { i as debugAddon };
