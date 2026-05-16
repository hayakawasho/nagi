import type { Cue } from "../../types";
export declare function visible(opts?: IntersectionObserverInit): Cue;
export declare function idle(timeout?: number): Cue;
export declare function media(query: string): Cue;
export declare function interaction(events?: string[]): Cue;
