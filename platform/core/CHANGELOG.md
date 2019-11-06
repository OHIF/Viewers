# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.7.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.6.2...@ohif/core@1.7.0) (2019-11-05)


### Features

* 🎸 Filter by url query param for seriesInstnaceUID ([#1117](https://github.com/OHIF/Viewers/issues/1117)) ([e208f2e](https://github.com/OHIF/Viewers/commit/e208f2e6a9c49b16dadead0a917f657cf023929a)), closes [#1118](https://github.com/OHIF/Viewers/issues/1118)





## [1.6.2](https://github.com/OHIF/Viewers/compare/@ohif/core@1.6.1...@ohif/core@1.6.2) (2019-11-05)


### Bug Fixes

* [#1075](https://github.com/OHIF/Viewers/issues/1075) Returning to the Study List before all series have finishe… ([#1090](https://github.com/OHIF/Viewers/issues/1090)) ([ecaf578](https://github.com/OHIF/Viewers/commit/ecaf578f92dc40294cec7ff9b272fb432dec4125))





## [1.6.1](https://github.com/OHIF/Viewers/compare/@ohif/core@1.6.0...@ohif/core@1.6.1) (2019-10-31)


### Bug Fixes

* application crash if patientName is an object ([#1138](https://github.com/OHIF/Viewers/issues/1138)) ([64cf3b3](https://github.com/OHIF/Viewers/commit/64cf3b324da2383a927af1df2d46db2fca5318aa))





# [1.6.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.5.2...@ohif/core@1.6.0) (2019-10-26)


### Features

* Snapshot Download Tool ([#840](https://github.com/OHIF/Viewers/issues/840)) ([450e098](https://github.com/OHIF/Viewers/commit/450e0981a5ba054fcfcb85eeaeb18371af9088f8))





## [1.5.2](https://github.com/OHIF/Viewers/compare/@ohif/core@1.5.1...@ohif/core@1.5.2) (2019-10-25)


### Bug Fixes

* set SR in ActiveViewport by clicking thumb ([#1091](https://github.com/OHIF/Viewers/issues/1091)) ([986b7ae](https://github.com/OHIF/Viewers/commit/986b7ae2bf4f7d27f326e62f93285ce20eaf0a79))





## [1.5.1](https://github.com/OHIF/Viewers/compare/@ohif/core@1.5.0...@ohif/core@1.5.1) (2019-10-25)


### Bug Fixes

* 🐛 Orthographic MPR fix ([#1092](https://github.com/OHIF/Viewers/issues/1092)) ([460e375](https://github.com/OHIF/Viewers/commit/460e375f0aa75d35f7a46b4d48e6cc706019956d))





# [1.5.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.4.0...@ohif/core@1.5.0) (2019-10-25)


### Features

* 🎸 Allow routes to load Google Cloud DICOM Stores in the Study List ([#1069](https://github.com/OHIF/Viewers/issues/1069)) ([21b586b](https://github.com/OHIF/Viewers/commit/21b586b08f3dde6613859712a9e0577dece564db))





# [1.4.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.3.2...@ohif/core@1.4.0) (2019-10-15)


### Features

* 🎸 Only allow reconstruction of datasets that make sense ([#1010](https://github.com/OHIF/Viewers/issues/1010)) ([2d75e01](https://github.com/OHIF/Viewers/commit/2d75e01)), closes [#561](https://github.com/OHIF/Viewers/issues/561)





## [1.3.2](https://github.com/OHIF/Viewers/compare/@ohif/core@1.3.1...@ohif/core@1.3.2) (2019-10-14)


### Bug Fixes

* Return display sets in StudyMetadata._createDisplaySetsForSeries ([#1042](https://github.com/OHIF/Viewers/issues/1042)) ([fc01532](https://github.com/OHIF/Viewers/commit/fc01532))





## [1.3.1](https://github.com/OHIF/Viewers/compare/@ohif/core@1.3.0...@ohif/core@1.3.1) (2019-10-11)

**Note:** Version bump only for package @ohif/core





# [1.3.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.2.0...@ohif/core@1.3.0) (2019-10-11)


### Features

* 🎸 Improve usability of Google Cloud adapter, including direct routes to studies ([#989](https://github.com/OHIF/Viewers/issues/989)) ([2bc361c](https://github.com/OHIF/Viewers/commit/2bc361c))





# [1.2.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.1.0...@ohif/core@1.2.0) (2019-10-09)


### Bug Fixes

* OHIF-1002 Study lazy load should be true by default ([#1004](https://github.com/OHIF/Viewers/issues/1004)) ([66d8bc6](https://github.com/OHIF/Viewers/commit/66d8bc6))


### Features

* Allow a server requestOptions.auth to be a function that returns the Authorization header. ([#928](https://github.com/OHIF/Viewers/issues/928)) ([0064a4b](https://github.com/OHIF/Viewers/commit/0064a4b))





# [1.1.0](https://github.com/OHIF/Viewers/compare/@ohif/core@1.0.2...@ohif/core@1.1.0) (2019-10-03)


### Features

* Use QIDO + WADO to load series metadata individually rather than the entire study metadata at once ([#953](https://github.com/OHIF/Viewers/issues/953)) ([9e10c2b](https://github.com/OHIF/Viewers/commit/9e10c2b))





## [1.0.2](https://github.com/OHIF/Viewers/compare/@ohif/core@1.0.1...@ohif/core@1.0.2) (2019-10-02)


### Bug Fixes

* Temporarily sort SEG files to the end of the display set list as a workaround for several metadata issues ([#987](https://github.com/OHIF/Viewers/issues/987)) ([b3b4c10](https://github.com/OHIF/Viewers/commit/b3b4c10))





## [1.0.1](https://github.com/OHIF/Viewers/compare/@ohif/core@1.0.0...@ohif/core@1.0.1) (2019-09-27)


### Bug Fixes

* Check for Value in 00081155 sequence (Few patient protocol images doesn't have this value) and removed a duplicate declaration ([#921](https://github.com/OHIF/Viewers/issues/921)) ([d0ec9cf](https://github.com/OHIF/Viewers/commit/d0ec9cf))





# [1.0.0](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.10...@ohif/core@1.0.0) (2019-09-27)


### Bug Fixes

* 🐛 Add DicomLoaderService & FileLoaderService to fix SR, PDF, and SEG support in local file and WADO-RS-only use cases ([#862](https://github.com/OHIF/Viewers/issues/862)) ([e7e1a8a](https://github.com/OHIF/Viewers/commit/e7e1a8a)), closes [#838](https://github.com/OHIF/Viewers/issues/838)


### BREAKING CHANGES

* DICOM Seg





## [0.50.10](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.9...@ohif/core@0.50.10) (2019-09-23)


### Bug Fixes

* Avoid using variable name "module" ([#942](https://github.com/OHIF/Viewers/issues/942)) ([72427fe](https://github.com/OHIF/Viewers/commit/72427fe)), closes [#940](https://github.com/OHIF/Viewers/issues/940)





## [0.50.9](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.8...@ohif/core@0.50.9) (2019-09-17)


### Bug Fixes

* bump cornerstone-tools version in peerDeps ([4afc88c](https://github.com/OHIF/Viewers/commit/4afc88c))





## [0.50.8](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.7...@ohif/core@0.50.8) (2019-09-10)

**Note:** Version bump only for package @ohif/core





## [0.50.7](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.6...@ohif/core@0.50.7) (2019-09-10)


### Bug Fixes

* remove requestOptions when key is not needed ([32bc47d](https://github.com/OHIF/Viewers/commit/32bc47d))





## [0.50.6](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.5...@ohif/core@0.50.6) (2019-09-09)

**Note:** Version bump only for package @ohif/core





## [0.50.5](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.4...@ohif/core@0.50.5) (2019-09-04)

**Note:** Version bump only for package @ohif/core





## [0.50.4](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.3...@ohif/core@0.50.4) (2019-09-04)


### Bug Fixes

* measurementsAPI issue caused by production build ([#842](https://github.com/OHIF/Viewers/issues/842)) ([49d3439](https://github.com/OHIF/Viewers/commit/49d3439))





## [0.50.3](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.2...@ohif/core@0.50.3) (2019-08-26)


### Bug Fixes

* **Studies:** Qidosupportsincludefield should be true by default ([#801](https://github.com/OHIF/Viewers/issues/801)) ([a88d865](https://github.com/OHIF/Viewers/commit/a88d865))





## [0.50.2](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.1...@ohif/core@0.50.2) (2019-08-22)

**Note:** Version bump only for package @ohif/core





## [0.50.1](https://github.com/OHIF/Viewers/compare/@ohif/core@0.50.0-alpha.10...@ohif/core@0.50.1) (2019-08-14)

**Note:** Version bump only for package @ohif/core





# [0.50.0-alpha.10](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.9...@ohif/core@0.50.0-alpha.10) (2019-08-14)

**Note:** Version bump only for package @ohif/core





## [0.11.1-alpha.9](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.8...@ohif/core@0.11.1-alpha.9) (2019-08-14)

**Note:** Version bump only for package @ohif/core





## 0.11.1-alpha.8 (2019-08-14)

**Note:** Version bump only for package @ohif/core





# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.1-alpha.7](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.6...@ohif/core@0.11.1-alpha.7) (2019-08-08)

**Note:** Version bump only for package @ohif/core

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.1-alpha.6](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.5...@ohif/core@0.11.1-alpha.6) (2019-08-08)

**Note:** Version bump only for package @ohif/core

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.1-alpha.5](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.4...@ohif/core@0.11.1-alpha.5) (2019-08-08)

**Note:** Version bump only for package @ohif/core

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.1-alpha.4](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.3...@ohif/core@0.11.1-alpha.4) (2019-08-08)

**Note:** Version bump only for package @ohif/core

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.1-alpha.3](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.2...@ohif/core@0.11.1-alpha.3) (2019-08-08)

**Note:** Version bump only for package @ohif/core

# Change Log

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.11.1-alpha.2](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.1...@ohif/core@0.11.1-alpha.2) (2019-08-07)

**Note:** Version bump only for package @ohif/core

## [0.11.1-alpha.1](https://github.com/OHIF/Viewers/compare/@ohif/core@0.11.1-alpha.0...@ohif/core@0.11.1-alpha.1) (2019-08-07)

**Note:** Version bump only for package @ohif/core

## 0.11.1-alpha.0 (2019-08-05)

**Note:** Version bump only for package @ohif/core
