import type { ComponentProps, ComponentSetup, RefElement } from "../types";

export function defineComponent<
  SetupResult extends Record<string, unknown> | void,
  Props extends Record<string, unknown>,
>(opts: {
  name: string;
  props: Props;
  setup(el: RefElement, props: ComponentProps<Props>): SetupResult;
}): ComponentSetup<SetupResult, Props>;
export function defineComponent<
  SetupResult extends Record<string, unknown> | void,
  Props extends Record<string, unknown>,
>(opts: {
  name: string;
  setup(el: RefElement, props: ComponentProps<Props>): SetupResult;
}): ComponentSetup<SetupResult, Props>;
export function defineComponent<
  SetupResult extends Record<string, unknown> | void,
>(opts: {
  name: string;
  setup(el: RefElement): SetupResult;
}): ComponentSetup<SetupResult, Record<string, never>>;
export function defineComponent(opts: ComponentSetup): ComponentSetup;
export function defineComponent(opts: ComponentSetup) {
  return opts;
}
