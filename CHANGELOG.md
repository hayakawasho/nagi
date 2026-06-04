# Changelog

All notable changes to `@usenagi/core` are documented here. Release notes also appear on [GitHub Releases](https://github.com/hayakawasho/nagi/releases).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.5.1] - 2026-06-05

### Changed

- Added `useDeferredUnmount` documentation to README (EN/JA).

## [0.5.0] - 2026-06-05

### Added

- `useDeferredUnmount(callback)` lifecycle hook — run async work (e.g. exit animations) before a component is removed from the DOM. The callback runs before `useUnmount`, so cleanup hooks execute only after the deferred work completes.
- `useSlot().removeChild()` now awaits deferred unmount callbacks before running cleanup, enabling parent-driven async teardown of dynamic children.
- `errorReport` utility for structured lifecycle error reporting.

### Changed

- Child unmount ordering: `removeChild` now runs deferred unmount → splice → synchronous unmount in a safe sequence that handles concurrent removals.
- Guard against multiple unmount executions on the same component instance.
- `DomRefCache` refactored for clarity.

### Fixed

- `removeChild` type definition corrected to accept `ComponentContext`.
- Scheduler addon unmount middleware now returns the `next()` result.

Full change set: [#418](https://github.com/hayakawasho/nagi/pull/418).

## [0.4.3] - 2026-05-24

### Changed

- Internal: refactored addon registry and scheduler deferred mount tracking to class-based implementations.
- Internal: moved mount middleware types from the public addon module to `_internal/addonRegistry`.

## [0.4.2] - 2026-05-24

### Fixed

- Moved package documentation (`README.md`, `README.ja.md`, `LICENSE`) into `packages/core` for npm. Root README now points to the package docs.
- Added `repository.directory` so npm README links resolve to the correct monorepo paths.
- Fixed example links in package READMEs to point at the repo-root `examples/` directory.

## [0.4.1] - 2026-05-23

### Changed

- Internal: reorganized repository into an npm workspaces layout (`packages/core`, `packages/addons`). No user-facing API, import path, or install changes.

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
