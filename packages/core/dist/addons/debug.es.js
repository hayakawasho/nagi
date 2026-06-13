import { t as e } from "../addon-DptsY8c_.js";
//#region ../addons/debug/index.ts
function t(e) {
	let t = e.path ?? e.name, n = e.uid ? ` (${e.uid})` : "", r = e.elementLabel ? ` <${e.elementLabel}>` : "";
	return `[nagi:debug] ${e.level}:${e.source}:${e.phase} ${t}${n}${r}`;
}
function n() {
	return e({
		name: "@usenagi/debug",
		install(e) {
			e.setDebugReporter((e) => {
				console.error(t(e), e.cause);
			});
		}
	});
}
//#endregion
export { n as debugAddon };
