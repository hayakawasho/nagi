# Changelog

All notable changes to `@usenagi/core` are documented here. Release notes also appear on [GitHub Releases](https://github.com/hayakawasho/nagi/releases).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.0] - 2026-05-23

### Added

- GitHub Actions CI workflow (lint + test).

### Changed

- Reorganized core and scheduler internals under `_internal/` directories.
- Moved `createContext`, `withContext`, and `propTypes` into clearer module layout.
- `useIntersectionWatch` now uses mount lifecycle internally.

### Breaking Changes

- `createScheduler` removed from `@usenagi/core/addons/scheduler` — use `schedulerAddon()` instead.
- Trimmed public type exports from `@usenagi/core`: `ComponentMiddleware`, `MountFn`, `MountMiddleware`, `UnmountFn`, `UnmountMiddleware`, `IComponent`, and `Scheduler` are no longer exported.
- `ComponentContext` is now exported from `./types` instead of `./core/component` (no change when importing from `@usenagi/core`).

### Migration

```ts
// Before (0.3.x)
import { createScheduler, schedulerAddon } from "@usenagi/core/addons/scheduler";

const custom = createScheduler({ priority: "high" });
const app = create().install(schedulerAddon());

// After (0.4.0)
import { schedulerAddon } from "@usenagi/core/addons/scheduler";

const app = create().install(schedulerAddon({ priority: "high" }));
```

Full change set: [#402](https://github.com/hayakawasho/nagi/pull/402).

## [0.3.0] - 2026-05-21

### Added

- `defineAddon({ name, install(ctx) })` and `app.install(...addons)` for extensible mount, unmount, and component middleware.
- `propTypes` for component prop validation.
- Exported addon types: `Addon`, `AddonContext`, `MountOptions`, and related middleware types.

### Breaking Changes

- `create({ scheduler })` removed — use `create().install(schedulerAddon())`.
- `when` and `priority` mount options require `schedulerAddon()`; they are no longer accepted by core `create()` alone.

### Migration

```ts
// Before (0.2.x)
import { create } from "@usenagi/core";
import { createScheduler } from "@usenagi/core/addons/scheduler";

const app = create({ scheduler: createScheduler() });
app.component(MyComp, { when: visible })(el);

// After (0.3.0)
import { create } from "@usenagi/core";
import { schedulerAddon } from "@usenagi/core/addons/scheduler";
import { visible } from "@usenagi/core/addons/cue";

const app = create().install(schedulerAddon());
app.component(MyComp, { when: visible })(el);
```

Full change set: [#398](https://github.com/hayakawasho/nagi/pull/398).

## [0.2.0] - 2026-05-19

### Breaking Changes

- `ref()` → `signal()`
- `computed()` → `useComputed()`
- `Ref` / `ReadonlyRef` → `Signal` / `ReadonlySignal`
- `useRootRef()` removed — use the `setup(el)` argument for the root element.

### Migration

```ts
// Before (0.1.x)
import { ref, computed, useRootRef } from "@usenagi/core";
const n = ref(0);
const doubled = computed(() => n.value * 2);
const { root } = useRootRef();

// After (0.2.0)
import { signal, useComputed } from "@usenagi/core";
const n = signal(0);
const doubled = useComputed(() => n.value * 2);
// Use setup(el) { ... } for the root element
```

Full refactor: [#393](https://github.com/hayakawasho/nagi/pull/393).

## [0.1.0] - 2026-05-18

### Added

First public release.

- `computed(fn)` — derived state with automatic dependency tracking.
- BYO mounter — core provides `app.component(Comp)(el)` only; scanning and scheduling are left to the project.
- Addons: `@usenagi/core/addons/scheduler` and `@usenagi/core/addons/cue` (`visible`, `idle`, `interaction`, `media`) for deferred mount patterns.

Core API at release: `create` / `defineComponent` / `ref` / `readonly` / `computed` / `useWatch` / `useMount` / `useUnmount` / `useDomRef` / `useRootRef` / `useEvent` / `useSlot` / `useIntersectionWatch` / `useMediaQuery` / `createContext` / `withContext`.
