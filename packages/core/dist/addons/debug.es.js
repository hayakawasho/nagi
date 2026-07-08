import { defineAddon as e } from "@usenagi/core";
//#region ../addons/debug/index.ts
function t(e) {
	return e instanceof Error ? {
		name: e.name,
		message: e.message,
		stack: e.stack
	} : { message: String(e) };
}
function n(e) {
	let n = e.path ?? e.name, r = e.uid ? ` (${e.uid})` : "", i = e.elementLabel ? ` <${e.elementLabel}>` : "", a = t(e.cause), o = [a.name, a.message].filter(Boolean).join(": ");
	return `[nagi:debug] ${e.level}:${e.source}:${e.phase} ${n}${r}${i}: ${o}`;
}
function r() {
	return e({
		name: "@usenagi/debug",
		install(e) {
			e.addDebugReporter((e) => {
				console.error(n(e), e.cause);
			});
		}
	});
}
//#endregion
export { r as debugAddon };
