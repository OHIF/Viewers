# UI‑Next Playground — Prototyping Area (Design + User Testing)

This folder hosts lightweight prototypes that render UI‑Next components exactly as they appear in the viewer (same tokens, CSS, and build tooling). It is intended for rapid design iteration and user testing without pulling in the full app or docs site.

---

## What Changed (Playground refresh)

- Default route now loads the StudyList prototype.
  - `playground/index.tsx` dynamically imports a prototype based on the URL path; root `/` defaults to `studylist.tsx`.
  - If a route does not exist, the loader falls back to the StudyList prototype.
- Removed legacy files that caused confusion or drift:
  - `patient-table-prototype.tsx` (legacy table demo) was deleted.
  - `studylist/patient-studies-backup.json` (unused dataset) was deleted.
- StudyList prototype now imports the official Design System component:
  - `../../src/components/StudyList` instead of the old `../../StudyList` path.
- StudyList prototype remains a realistic harness for design testing, including selection, default workflow, double‑click launch, and a placeholder launch page at `/studylist/launch`.

---

## Run the Playground

```bash
cd platform/ui-next
# Development server (port 3100)
yarn dev
# or build a static preview
yarn build:playground
```

Open http://localhost:3100. The root path routes to `/studylist` by default.

---

## Add a New Prototype

1) Create a file in `platform/ui-next/playground`, for example:

```ts
// playground/my-demo.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper, Button } from '../src/components';

function App() {
  return (
    <ThemeWrapper>
      <div className="p-6">
        <Button>My Demo</Button>
      </div>
    </ThemeWrapper>
  );
}

const el = document.getElementById('root');
if (!el) throw new Error('Root element not found');
createRoot(el).render(<App />);
```

2) Navigate to it at: `http://localhost:3100/my-demo`

Notes
- Prototypes live alongside `studylist.tsx` and are loaded via the dynamic import in `playground/index.tsx`.
- Wrap content with `ThemeWrapper` (and any additional providers) to ensure tokens match the viewer.

---

## StudyList Prototype

- Entry files
  - `studylist.tsx` — shim that imports `studylist/entry.tsx`.
  - `studylist/entry.tsx` — mounts `studylist/app.tsx` using React 18 `createRoot`.
  - `studylist/app.tsx` — renders the DS `StudyList` with sample data and a launch handler.
  - `studylist/launch.tsx` — placeholder page (navigated to on workflow launch).
  - `studylist/patient-studies.json` — local dataset used by the prototype.
- How it wires the DS component
  - `StudyList` is imported from `../../src/components/StudyList`.
  - The prototype passes `onLaunch` to redirect to `/studylist/launch?wf=...` for testing.
  - Default workflow is persisted via localStorage (`studylist.defaultWorkflow`).

---

## Folder Layout

```
playground/
├─ index.tsx        # Dynamic loader (route → ./<slug>.tsx)
├─ studylist.tsx    # Default route entry (imports ./studylist/entry.tsx)
└─ studylist/
   ├─ app.tsx
   ├─ entry.tsx
   ├─ launch.tsx
   └─ patient-studies.json
```

---

## Conventions

- Always import UI from `../src/components/...` (or the published package) to ensure parity with the viewer.
- Keep prototype‑specific state and test data within the `playground` folder.
- Prefer small, focused files over large combined demos.
- Use `ThemeWrapper` to get the right token set and base CSS.

---

## Troubleshooting

- “Prototype not found” in console: check your filename and route match; the loader expects a `./<slug>.tsx` file.
- Missing root element: ensure your entry file renders into `#root` (the HTML template provides it).
- Styling mismatch: confirm `ThemeWrapper` wraps your content.

