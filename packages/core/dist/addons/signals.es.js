import { useUnmount as e } from "@usenagi/core";
import { batch as t, computed as n, effect as r, signal as i, untracked as a } from "@preact/signals-core";
//#region ../addons/signals/index.ts
function o(e) {
	return n(() => e.value);
}
function s(e, t) {
	let n = !0, i;
	return r(() => {
		let r = e.value;
		if (n) {
			n = !1, i = r;
			return;
		}
		let o = i;
		i = r, a(() => {
			t(r, o);
		});
	});
}
function c(t, n) {
	e(s(t, n));
}
function l(e) {
	return n(e);
}
function u(t) {
	e(r(t));
}
//#endregion
export { t as batch, o as readonly, i as signal, a as untracked, l as useComputed, u as useSignalEffect, c as useWatch };
