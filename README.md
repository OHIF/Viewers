<div align="center">

# 24x7 Dental SaaS Platform
### OHIF Viewer — Dental Mode Customization

**Built on top of the open-source [OHIF Medical Imaging Viewer](https://ohif.org/)**
A zero-footprint, browser-based DICOM viewer extended with a fully custom Dental Mode — featuring dental-specific measurements, a themed UI, tooth selection, Google authentication, and cloud deployment via Docker and Firebase.

---

[![Live Demo](https://img.shields.io/badge/Live%20Demo-x7--dental.web.app-blue?style=for-the-badge&logo=firebase)](https://ohif-dental-viewer-962047575449.us-central1.run.app)
[![GitHub](https://img.shields.io/badge/GitHub-bitbossing%2F24x7--ohif-181717?style=for-the-badge&logo=github)](https://github.com/bitbossing/24x7-ohif)
[![OHIF](https://img.shields.io/badge/Based%20on-OHIF%20Viewers-green?style=for-the-badge)](https://ohif.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

*April 13, 2026 — Dennis Jayvee Patricio*

</div>

---

## About

This project is a **fork of the [OHIF Viewers](https://github.com/OHIF/Viewers)** open-source platform, extended to serve as a specialized dental imaging SaaS application. All dental features are self-contained within a custom extension and mode to ensure zero impact on the original OHIF behavior.

Full OHIF documentation is available at [docs.ohif.org](https://docs.ohif.org/).

---

## Links

| Resource | URL |
|---|---|
| Live Website | [x7-dental.web.app](https://ohif-dental-viewer-962047575449.us-central1.run.app) |
| GitHub Repository | [github.com/bitbossing/24x7-ohif](https://github.com/bitbossing/24x7-ohif) |
| Demo Video | Coming soon |
| OHIF Official | [ohif.org](https://ohif.org/) |
| OHIF GitHub | [github.com/OHIF/Viewers](https://github.com/OHIF/Viewers) |
| OHIF Documentation | [docs.ohif.org](https://docs.ohif.org/) |
| OHIF Demo | [viewer.ohif.org](https://viewer.ohif.org/) |

---

## General Rules

These rules were followed throughout the entire development process:

- **New actions & behaviors must only be visible in Dental Mode** — no pollution of the base OHIF experience
- **Must re-use original code UI style** — feels native, not bolted-on
- **Refrain from editing existing code files** except where required in Tasks C & D
- **Old behavior must not be affected** — only Dental Mode introduces changes
- **Push every item and open a Pull Request for every task**

---

## Timeline

| Step | Time | Description |
|---|---|---|
| Step 1 | 0:30 | Understand Requirements & Breakdown Task |
| Step 2 | 1:00 | Test, Understand & Read OHIF Documentation |
| Step 3 | 2:00 | Task A — Setup Project & Dental Mode UI Customization |
| Step 4 | 2:00 | Task B — Dental Measurements Palette |
| Step 5 | 1:00 | Task C — User Preference Saving & Authentication |
| Step 6 | 1:00 | Task D — Refactor, Deployment & Testing |
| Step 7 | 0:30 | Documentation & Deliverables |
| **Total** | **8:00** | |

---

## Tasks & Pull Requests

### Task A — Setup Project & Dental Mode UI Customization
> PR: [bitbossing/24x7-ohif#1](https://github.com/bitbossing/24x7-ohif/pull/1)

- Fork the OHIF project
- Create and clone a branch to work on Task A
- Create a new mode `[dental-ui]` — "Dental Mode" based on Longitudinal Mode, isolated from original code
- Create a new extension `[dental-ui]` dedicated to Dental Mode, isolated from original code
- Add a **Theme Toggle button** on the Header to switch dental UI (color, font, icon)
- Add **Practice Name** after the Logo on the Header — `Dennis Jayvee Patricio`
- Auto-trigger **Patient Info** on the Header
- Add **Tooth Selector** on the Header
- Default to **2x2 Hanging Protocol**
  - Top-left: Current image
  - Top-right: Prior exam (empty if none)
  - Bottom: Bitewing placeholders

---

### Task B — Dental Measurements Palette
> PR: [bitbossing/24x7-ohif#2](https://github.com/bitbossing/24x7-ohif/pull/2)

- Create and clone a branch to work on Task B
- Create a new set of **Measurement Tools** for Dental Mode, saved to a new Dental Measurements Panel with auto-incrementing labels per tool type:
  - **PA Length** — Periapical Length Tool
  - **Canal Angle** — Canal Angle Tool
  - **Crown Width** — Crown Width Tool
  - **Root Length** — Root Length Tool
- Add **Sort & Filter** to the Dental Measurements panel
- Add **Download button** to export measurements as JSON

---

### Task C — User Preference Saving & Authentication
> PR: [bitbossing/24x7-ohif#3](https://github.com/bitbossing/24x7-ohif/pull/3)

- Create and clone a branch to work on Task C
- Setup Firebase Project and create a **Google Sign-In Login Page**
- Create a **Logout button** (avatar dropdown in the global header)
- **Save user theme preference** to `localStorage` — persists across sessions and page refreshes

---

### Task D — Refactor, Deployment & Testing
> PR: [bitbossing/24x7-ohif#4](https://github.com/bitbossing/24x7-ohif/pull/4)

- Create and clone a branch to work on Task D
- Build and deploy the project using **Docker → Google Cloud Run → Firebase Hosting**
- Full scale testing
- Fix discovered bugs
- Update README

---

## File Changes

`[A]` Added &nbsp; `[M]` Modified

```
├── platform                                          #
│   ├── app                                           #
│   │   ├── .env                                 [M] # Firebase project keys
│   │   ├── package.json                         [M] # Added firebase dependency
│   │   └── src                                       #
│   │       ├── App.tsx                          [M] # Firebase auth wrapper + UserInfo injection
│   │       ├── components                            #
│   │       │   └── FirebaseUserInfo.tsx         [A] # Avatar dropdown with logout
│   │       ├── routes                                #
│   │       │   ├── LoginPage.tsx                [A] # Google Sign-In page
│   │       │   └── WorkList                          #
│   │       │       └── WorkList.tsx             [M] # Added UserInfo to worklist header
│   │       └── utils                                 #
│   │           ├── firebaseConfig.ts            [A] # Firebase app initialization
│   │           └── FirebaseAuthRoutes.tsx       [A] # Auth gate (loading/login/app)
│   └── ui-next                                       #
│       └── src/components/Header                     #
│           └── Header.tsx                       [M] # Added UserInfo prop slot
├── extensions                                        #
│   ├── default                                       #
│   │   └── src/ViewerLayout                         #
│   │       └── ViewerHeader.tsx                 [M] # Reads UserInfo from customizationService
│   └── 24x7-dental-ui                               # Dental Extension
│       ├── package.json                         [M] # Removed firebase/ui-next peerDeps
│       └── src                                       #
│           ├── index.tsx                        [M] # Registered toolbar modules, onModeExit reset
│           ├── dentalThemeManager.ts            [M] # Theme toggle + localStorage persistence
│           ├── components                            #
│           │   ├── DentalBrandTitle.tsx         [M] # "Dennis Jayvee Patricio" brand label
│           │   ├── DentalThemeToggleButton.tsx  [M] # Theme toggle, restores on mount
│           │   ├── TabDentalMeasurements.tsx    [A] # Measurements tab icon
│           │   └── ToothSelectorButton.tsx      [A] # Tooth selector toolbar button
│           ├── hangingProtocols                      #
│           │   └── hpDental2x2.ts              [A] # 2x2 dental hanging protocol
│           ├── layouts                               #
│           │   └── DentalViewerLayout.tsx       [A] # Custom dental viewer layout
│           ├── measurements                          #
│           │   └── registerDentalMappings.ts    [A] # Dental measurement type mappings
│           ├── panels                                #
│           │   ├── PanelDentalMeasurements.tsx  [A] # Measurements panel with filters
│           │   └── PanelTrackedMeasurementsNoDental.tsx [A] # Fallback measurements panel
│           ├── styles                                #
│           │   └── dental-theme.css             [A] # Dental theme CSS overrides
│           └── tools                                 #
│               ├── PALengthTool.ts             [A] # Periapical length measurement tool
│               ├── CanalAngleTool.ts           [A] # Root canal angle tool
│               ├── CrownWidthTool.ts           [A] # Crown width measurement tool
│               └── RootLengthTool.ts           [A] # Root length measurement tool
├── modes                                             #
│   └── 24x7-dental-ui                               # Dental Mode
│       └── src                                       #
│           ├── index.tsx                        [M] # Mode config, toolbar layout, routes
│           └── i18n/locales/en-US                   #
│               └── Modes.json                   [A] # English translation strings
├── Dockerfile                                   [M] # Added Firebase build args
├── README.md                                   [M] # Added Firebase build args
├── firebase.json                                [A] # Hosting → Cloud Run proxy config
├── .firebaserc                                  [A] # Points CLI to x7-dental project
└── deploy.sh                                    [A] # Build → push → Cloud Run → Hosting
```

---

## Deployment

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI](https://firebase.google.com/docs/cli) — `npm install -g firebase-tools`
- [Git Bash](https://git-scm.com/) (Windows)

### One-time Setup

```bash
# 1. Authenticate with Google Cloud
gcloud init

# 2. Enable required GCP APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com --project x7-dental

# 3. Configure Docker to push to GCR
gcloud auth configure-docker

# 4. Authenticate Firebase CLI
firebase login
```

Then activate **Firebase Hosting** in the [Firebase Console](https://console.firebase.google.com/) under your project.

### Clone & Configure

```bash
git clone https://github.com/bitbossing/24x7-ohif.git
cd 24x7-ohif
yarn install --frozen-lockfile
```

Create `platform/app/.env` and fill in your Firebase project values:

```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Deploy

Open **Git Bash**, navigate to the project root, and run:

```bash
bash deploy.sh
```

This will:
1. Build the Docker image with Firebase keys baked in
2. Push to Google Container Registry
3. Deploy the container to Cloud Run
4. Deploy Firebase Hosting proxy rules

Your app will be live at `https://your-project-id.web.app`.

For subsequent deploys after code changes:

```bash
bash deploy.sh            # full rebuild + redeploy
bash deploy.sh --skip-build  # redeploy existing image only
```

---

## Credits

This project is built on top of the **OHIF Medical Imaging Viewer**, an open-source project by the [Open Health Imaging Foundation](https://ohif.org/). All original rights and licenses belong to the OHIF contributors.

- OHIF Website: [ohif.org](https://ohif.org/)
- OHIF GitHub: [github.com/OHIF/Viewers](https://github.com/OHIF/Viewers)
- OHIF Documentation: [docs.ohif.org](https://docs.ohif.org/)
- OHIF License: [MIT](https://github.com/OHIF/Viewers/blob/master/LICENSE)

---

<div align="center">
  <sub>Built by Dennis Jayvee Patricio &nbsp;·&nbsp; April 13, 2026</sub>
</div>
