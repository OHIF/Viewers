# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.9.0-beta.37](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.36...v3.9.0-beta.37) (2024-06-05)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.36](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.35...v3.9.0-beta.36) (2024-06-05)


### Bug Fixes

* get direct url pixel data should be optional for video ([#4152](https://github.com/OHIF/Viewers/issues/4152)) ([649ffab](https://github.com/OHIF/Viewers/commit/649ffab4d97be875d42e1a3473a4354aac14e87d))





# [3.9.0-beta.35](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.34...v3.9.0-beta.35) (2024-06-05)


### Bug Fixes

* **seg:** maintain algorithm name and algorithm type when DICOM seg is exported or downloaded ([#4203](https://github.com/OHIF/Viewers/issues/4203)) ([a29e94d](https://github.com/OHIF/Viewers/commit/a29e94de803f79bbb3372d00ad8eb14b4224edc2))





# [3.9.0-beta.34](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.33...v3.9.0-beta.34) (2024-06-05)


### Bug Fixes

* **hydration:** Maintain the same slice that the user was on pre hydration in post hydration for SR and SEG. ([#4200](https://github.com/OHIF/Viewers/issues/4200)) ([430330f](https://github.com/OHIF/Viewers/commit/430330f7e384d503cb6fc695a7a9642ddfaac313))





# [3.9.0-beta.33](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.32...v3.9.0-beta.33) (2024-06-05)


### Features

* **window-level-region:** add window level region tool ([#4127](https://github.com/OHIF/Viewers/issues/4127)) ([ab1a18a](https://github.com/OHIF/Viewers/commit/ab1a18af5a5b0f9086c080ed81c8fda9bfaa975b))





# [3.9.0-beta.32](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.31...v3.9.0-beta.32) (2024-05-31)


### Bug Fixes

* **tmtv:** crosshairs should not have viewport indicators ([#4197](https://github.com/OHIF/Viewers/issues/4197)) ([f85da32](https://github.com/OHIF/Viewers/commit/f85da32f34389ef7cecae03c07e0af26468b52a6))





# [3.9.0-beta.31](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.30...v3.9.0-beta.31) (2024-05-30)


### Bug Fixes

* **seg:** should be able to navigate outside toolbox and come back later ([#4196](https://github.com/OHIF/Viewers/issues/4196)) ([93e7609](https://github.com/OHIF/Viewers/commit/93e760937f6587ba7481fcf3484ba9004ba49a62))





# [3.9.0-beta.30](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.29...v3.9.0-beta.30) (2024-05-30)


### Bug Fixes

* **docker:** docker build was broken because of imports ([#4192](https://github.com/OHIF/Viewers/issues/4192)) ([d7aa386](https://github.com/OHIF/Viewers/commit/d7aa386800153e0bb9eea6bbf36c696c57750ad8))
* segmentation creation and segmentation mode viewport rendering ([#4193](https://github.com/OHIF/Viewers/issues/4193)) ([2174026](https://github.com/OHIF/Viewers/commit/217402678981f74293dff615f6b6812e54216d37))





# [3.9.0-beta.29](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.28...v3.9.0-beta.29) (2024-05-30)


### Bug Fixes

* **tmtv:** side panel crashing when activeToolOptions is not an array ([#4189](https://github.com/OHIF/Viewers/issues/4189)) ([19b5b1c](https://github.com/OHIF/Viewers/commit/19b5b1c15cb29ddf1cfd9b608815199bc838f8b2))





# [3.9.0-beta.28](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.27...v3.9.0-beta.28) (2024-05-30)


### Bug Fixes

* **queryparam:** set all query params to lowercase by default ([#4190](https://github.com/OHIF/Viewers/issues/4190)) ([e073d19](https://github.com/OHIF/Viewers/commit/e073d195fdec7f8bdb67e5e3dae522a0fd121ad2))





# [3.9.0-beta.27](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.26...v3.9.0-beta.27) (2024-05-29)


### Bug Fixes

* **contour:** set renderFill to false for contour ([#4186](https://github.com/OHIF/Viewers/issues/4186)) ([731340d](https://github.com/OHIF/Viewers/commit/731340d70ab23e116dd23e80b880bd8a28526f19))





# [3.9.0-beta.26](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.25...v3.9.0-beta.26) (2024-05-29)


### Features

* **hp:** Add displayArea option for Hanging protocols and example with Mamo([#3808](https://github.com/OHIF/Viewers/issues/3808)) ([18ac08e](https://github.com/OHIF/Viewers/commit/18ac08ed860d119721c52e4ffc270332259100b6))





# [3.9.0-beta.25](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.24...v3.9.0-beta.25) (2024-05-29)


### Bug Fixes

* **ultrasound:** Upgrade cornerstone3D version to resolve coloring issues ([#4181](https://github.com/OHIF/Viewers/issues/4181)) ([75a71db](https://github.com/OHIF/Viewers/commit/75a71db7f89840250ad1c2b35df5a35aceb8be7d))





# [3.9.0-beta.24](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.23...v3.9.0-beta.24) (2024-05-29)


### Features

* **measurements:** show untracked measurements in measurement panel under additional findings ([#4160](https://github.com/OHIF/Viewers/issues/4160)) ([18686c2](https://github.com/OHIF/Viewers/commit/18686c2caf13ede3e881303100bd4cc34b8b135f))





# [3.9.0-beta.23](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.22...v3.9.0-beta.23) (2024-05-28)


### Bug Fixes

* **rt:** dont convert to volume for RTSTRUCT ([#4157](https://github.com/OHIF/Viewers/issues/4157)) ([7745c09](https://github.com/OHIF/Viewers/commit/7745c092bb3edf0090f32fbbbae2f0776128d5a2))





# [3.9.0-beta.22](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.21...v3.9.0-beta.22) (2024-05-27)


### Features

* **ui:** move to React 18 and base for using shadcn/ui ([#4174](https://github.com/OHIF/Viewers/issues/4174)) ([70f2c79](https://github.com/OHIF/Viewers/commit/70f2c797f42af603d7ea0eb8d23b4103aba66f77))





# [3.9.0-beta.21](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.20...v3.9.0-beta.21) (2024-05-24)


### Features

* **types:** typed app config ([#4171](https://github.com/OHIF/Viewers/issues/4171)) ([8960b89](https://github.com/OHIF/Viewers/commit/8960b89911a9342d93bf1a62bec97a696f101fd4))





# [3.9.0-beta.20](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.19...v3.9.0-beta.20) (2024-05-24)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.19](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.18...v3.9.0-beta.19) (2024-05-24)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.18](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.17...v3.9.0-beta.18) (2024-05-24)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.17](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.16...v3.9.0-beta.17) (2024-05-23)


### Bug Fixes

* **crosshairs:** reset angle, position, and slabthickness for crosshairs when reset viewport tool is used ([#4113](https://github.com/OHIF/Viewers/issues/4113)) ([73d9e99](https://github.com/OHIF/Viewers/commit/73d9e99d5d6f38ab6c36f4471d54f18798feacb4))





# [3.9.0-beta.16](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.15...v3.9.0-beta.16) (2024-05-23)


### Bug Fixes

* dicom json for orthanc by Update package versions for [@cornerstonejs](https://github.com/cornerstonejs) dependencies ([#4165](https://github.com/OHIF/Viewers/issues/4165)) ([34c7d72](https://github.com/OHIF/Viewers/commit/34c7d72142847486b98c9c52469940083eeaf87e))





# [3.9.0-beta.15](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.14...v3.9.0-beta.15) (2024-05-22)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.14](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.13...v3.9.0-beta.14) (2024-05-21)


### Bug Fixes

* **HangingProtocol:** fix hp when unsupported series load first ([#4145](https://github.com/OHIF/Viewers/issues/4145)) ([b124c91](https://github.com/OHIF/Viewers/commit/b124c91d8fa0def262d1fee8f105295b02864129))





# [3.9.0-beta.13](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.12...v3.9.0-beta.13) (2024-05-21)


### Features

* **rt:** allow rendering of points in RT Struct ([#4128](https://github.com/OHIF/Viewers/issues/4128)) ([5903b07](https://github.com/OHIF/Viewers/commit/5903b0749aa41112d2e991bf53ed29b1fd7bd13f))





# [3.9.0-beta.12](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.11...v3.9.0-beta.12) (2024-05-21)


### Bug Fixes

* **segmentation:** Address issue where segmentation creation failed on layout change ([#4153](https://github.com/OHIF/Viewers/issues/4153)) ([29944c8](https://github.com/OHIF/Viewers/commit/29944c8512c35718af03c03ef82bc43675ee1872))





# [3.9.0-beta.11](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.10...v3.9.0-beta.11) (2024-05-21)


### Features

* **test:** Playwright testing integration ([#4146](https://github.com/OHIF/Viewers/issues/4146)) ([fe1a706](https://github.com/OHIF/Viewers/commit/fe1a706446cc33670bf5fab8451e8281b487fcd6))





# [3.9.0-beta.10](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.9...v3.9.0-beta.10) (2024-05-21)


### Bug Fixes

* **stack-invalidation:** Resolve stack invalidation if metadata invalidated ([#4147](https://github.com/OHIF/Viewers/issues/4147)) ([70bb6c4](https://github.com/OHIF/Viewers/commit/70bb6c46267b3733a665f12534b849c890ce54ad))





# [3.9.0-beta.9](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.8...v3.9.0-beta.9) (2024-05-17)


### Bug Fixes

* **select:** utilize react portals for select component ([#4144](https://github.com/OHIF/Viewers/issues/4144)) ([dce1e7d](https://github.com/OHIF/Viewers/commit/dce1e7d423cb64ec0d4be7362ecbfd52db47ef36))





# [3.9.0-beta.8](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.7...v3.9.0-beta.8) (2024-05-16)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.7](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.6...v3.9.0-beta.7) (2024-05-15)


### Bug Fixes

* **tmtv:** threshold was crashing the side panel ([#4119](https://github.com/OHIF/Viewers/issues/4119)) ([8d5c676](https://github.com/OHIF/Viewers/commit/8d5c676a5e1f3eda664071c8aece313de766bd59))





# [3.9.0-beta.6](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.5...v3.9.0-beta.6) (2024-05-15)


### Bug Fixes

* 🐛 Overflow scroll list menu based on screen hight ([#4123](https://github.com/OHIF/Viewers/issues/4123)) ([6bba2e7](https://github.com/OHIF/Viewers/commit/6bba2e70f80d8eacc57c0e765013d9c10adf5413))





# [3.9.0-beta.5](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.4...v3.9.0-beta.5) (2024-05-14)

**Note:** Version bump only for package ohif-monorepo-root





# [3.9.0-beta.4](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.3...v3.9.0-beta.4) (2024-05-14)


### Bug Fixes

* **auth:** bind handleUnauthenticated to correct context ([#4120](https://github.com/OHIF/Viewers/issues/4120)) ([8fa339f](https://github.com/OHIF/Viewers/commit/8fa339f296fd7e844f3879cfd81e47dbff315e66))
* **DicomJSONDataSource:** Fix series filtering ([#4092](https://github.com/OHIF/Viewers/issues/4092)) ([2de102c](https://github.com/OHIF/Viewers/commit/2de102c73c795cfb48b49005b10aa788444a45b7))





# [3.9.0-beta.3](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.2...v3.9.0-beta.3) (2024-05-08)


### Features

* **typings:** Enhance typing support with withAppTypes and custom services throughout OHIF ([#4090](https://github.com/OHIF/Viewers/issues/4090)) ([374065b](https://github.com/OHIF/Viewers/commit/374065bc3bad9d212f9817a8d41546cc64cfabfb))





# [3.9.0-beta.2](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.1...v3.9.0-beta.2) (2024-05-06)


### Bug Fixes

* **bugs:** enhancements and bugs in several areas ([#4086](https://github.com/OHIF/Viewers/issues/4086)) ([730f434](https://github.com/OHIF/Viewers/commit/730f4349100f21b4489a21707dbb2dca9dbfbba2))





# [3.9.0-beta.1](https://github.com/OHIF/Viewers/compare/v3.9.0-beta.0...v3.9.0-beta.1) (2024-05-06)


### Bug Fixes

* **rt:** enhanced RT support, utilize SVGs for rendering. ([#4074](https://github.com/OHIF/Viewers/issues/4074)) ([0156bc4](https://github.com/OHIF/Viewers/commit/0156bc426f1840ae0d090223e94a643726e856cb))





# [3.9.0-beta.0](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.94...v3.9.0-beta.0) (2024-04-29)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.94](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.93...v3.8.0-beta.94) (2024-04-29)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.93](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.92...v3.8.0-beta.93) (2024-04-29)


### Bug Fixes

* **toolbox:** Preserve user-specified tool state and streamline command execution ([#4063](https://github.com/OHIF/Viewers/issues/4063)) ([f1a736d](https://github.com/OHIF/Viewers/commit/f1a736d1934733a434cb87b2c284907a3122403f))





# [3.8.0-beta.92](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.91...v3.8.0-beta.92) (2024-04-28)


### Bug Fixes

* **bugs:** fix patient header for doc, track ball rotate resize observer and add segmentation button not being enabled on viewport data change ([#4068](https://github.com/OHIF/Viewers/issues/4068)) ([c09311d](https://github.com/OHIF/Viewers/commit/c09311d3b7df05fcd00a9f36a7233e9d7e5589d0))





# [3.8.0-beta.91](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.90...v3.8.0-beta.91) (2024-04-25)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.90](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.89...v3.8.0-beta.90) (2024-04-22)


### Bug Fixes

* **viewport-sync:** Enable re-sync image slices in a different position when needed ([#3984](https://github.com/OHIF/Viewers/issues/3984)) ([6ebd2cc](https://github.com/OHIF/Viewers/commit/6ebd2cc7cb70cd88fd01dc1e516077f27b201943))





# [3.8.0-beta.89](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.88...v3.8.0-beta.89) (2024-04-22)


### Bug Fixes

* **vewport:** Add missing blendmodes from cornerstonejs ([#4055](https://github.com/OHIF/Viewers/issues/4055)) ([3ec7e51](https://github.com/OHIF/Viewers/commit/3ec7e512169a07506388902acb5b2c118093fa50))
* **viewport-webworker-segmentation:** Resolve issues with viewport detection, webworker termination, and segmentation panel layout change ([#4059](https://github.com/OHIF/Viewers/issues/4059)) ([52a0c59](https://github.com/OHIF/Viewers/commit/52a0c59294a4161fcca0a6708855549034849951))





# [3.8.0-beta.88](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.87...v3.8.0-beta.88) (2024-04-22)


### Bug Fixes

* **hp:** Fails to display any layouts in the layout selector if first layout has multiple stages ([#4058](https://github.com/OHIF/Viewers/issues/4058)) ([f0ed3fd](https://github.com/OHIF/Viewers/commit/f0ed3fd7b99b0e4e00b261ceb9888ba94726719c))





# [3.8.0-beta.87](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.86...v3.8.0-beta.87) (2024-04-19)


### Features

* **tmtv-mode:** Add Brush tools and move SUV peak calculation to web worker ([#4053](https://github.com/OHIF/Viewers/issues/4053)) ([8192e34](https://github.com/OHIF/Viewers/commit/8192e348eca993fec331d4963efe88f9a730eceb))





# [3.8.0-beta.86](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.85...v3.8.0-beta.86) (2024-04-19)


### Bug Fixes

* **layouts:** and fix thumbnail in touch and update migration guide for 3.8 release ([#4052](https://github.com/OHIF/Viewers/issues/4052)) ([d250d04](https://github.com/OHIF/Viewers/commit/d250d04580883446fcb8d748b2a97c5c198922af))





# [3.8.0-beta.85](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.84...v3.8.0-beta.85) (2024-04-18)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.84](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.83...v3.8.0-beta.84) (2024-04-18)


### Bug Fixes

* **bugs:** and replace seriesInstanceUID and seriesInstanceUIDs URL with seriesInstanceUIDs ([#4049](https://github.com/OHIF/Viewers/issues/4049)) ([da7c1a5](https://github.com/OHIF/Viewers/commit/da7c1a5d8c54bfa1d3f97bbc500386bf76e7fd9d))





# [3.8.0-beta.83](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.82...v3.8.0-beta.83) (2024-04-18)


### Bug Fixes

* **bugs:** enhancements and bug fixes - final ([#4048](https://github.com/OHIF/Viewers/issues/4048)) ([170bb96](https://github.com/OHIF/Viewers/commit/170bb96983082c39b22b7352e0c54aacf3e73b02))





# [3.8.0-beta.82](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.81...v3.8.0-beta.82) (2024-04-17)


### Bug Fixes

* **bugs:** enhancements and bug fixes - more ([#4043](https://github.com/OHIF/Viewers/issues/4043)) ([3754c22](https://github.com/OHIF/Viewers/commit/3754c224b4dab28182adb0a41e37d890942144d8))





# [3.8.0-beta.81](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.80...v3.8.0-beta.81) (2024-04-16)


### Bug Fixes

* **viewport:** Reset viewport state and fix CINE looping, thumbnail resolution, and dynamic tool settings ([#4037](https://github.com/OHIF/Viewers/issues/4037)) ([f99a0bf](https://github.com/OHIF/Viewers/commit/f99a0bfb31434aa137bbb3ed1f9eef1dfcc09025))





# [3.8.0-beta.80](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.79...v3.8.0-beta.80) (2024-04-16)


### Bug Fixes

* **bugs:** enhancements and bug fixes ([#4036](https://github.com/OHIF/Viewers/issues/4036)) ([e80fc6f](https://github.com/OHIF/Viewers/commit/e80fc6f47708e1d6b1a1e1de438196a4b74ec637))





# [3.8.0-beta.79](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.78...v3.8.0-beta.79) (2024-04-10)


### Features

* **SM:** remove SM measurements from measurement panel ([#4022](https://github.com/OHIF/Viewers/issues/4022)) ([df49a65](https://github.com/OHIF/Viewers/commit/df49a653be61a93f6e9fb3663aabe9775c31fd13))





# [3.8.0-beta.78](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.77...v3.8.0-beta.78) (2024-04-10)


### Bug Fixes

* **general:** enhancements and bug fixes ([#4018](https://github.com/OHIF/Viewers/issues/4018)) ([2b83393](https://github.com/OHIF/Viewers/commit/2b83393f91cb16ea06821d79d14ff60f80c29c90))





# [3.8.0-beta.77](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.76...v3.8.0-beta.77) (2024-04-10)


### Bug Fixes

* **dicom-video:** Update get direct func for dicom json to use url if present and fix config argument ([#4017](https://github.com/OHIF/Viewers/issues/4017)) ([4f99244](https://github.com/OHIF/Viewers/commit/4f99244d864427d69be6f863cb7a6a78411adb12))





# [3.8.0-beta.76](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.75...v3.8.0-beta.76) (2024-04-10)


### Bug Fixes

* **MetaDataProvider:** Fix tag in GeneralImageModule ([#4000](https://github.com/OHIF/Viewers/issues/4000)) ([e9c30a1](https://github.com/OHIF/Viewers/commit/e9c30a108e2dd14a8b137b81e5b832cc167bc3d1))





# [3.8.0-beta.75](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.74...v3.8.0-beta.75) (2024-04-10)


### Bug Fixes

* Microscopy bulkdata and image retrieve ([#3894](https://github.com/OHIF/Viewers/issues/3894)) ([7fac49b](https://github.com/OHIF/Viewers/commit/7fac49b4492b4bd5e9ece8e2e2b0fa2faa840d7f))





# [3.8.0-beta.74](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.73...v3.8.0-beta.74) (2024-04-10)


### Features

* **4D:** Add 4D dynamic volume rendering and new pre-clinical 4d pt/ct mode ([#3664](https://github.com/OHIF/Viewers/issues/3664)) ([d57e8bc](https://github.com/OHIF/Viewers/commit/d57e8bc1571c6da4effaa492ee2d162c552365a2))





# [3.8.0-beta.73](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.72...v3.8.0-beta.73) (2024-04-08)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.72](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.71...v3.8.0-beta.72) (2024-04-05)


### Bug Fixes

* **cornerstone-dicom-sr:** Freehand SR hydration support ([#3996](https://github.com/OHIF/Viewers/issues/3996)) ([5645ac1](https://github.com/OHIF/Viewers/commit/5645ac1b271e1ed8c57f5d71100809362447267e))





# [3.8.0-beta.71](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.70...v3.8.0-beta.71) (2024-04-05)


### Features

* **advanced-roi-tools:** new tools and icon updates and overlay bug fixes ([#4014](https://github.com/OHIF/Viewers/issues/4014)) ([cea27d4](https://github.com/OHIF/Viewers/commit/cea27d438d1de2c1ec90cbaefdc2b31a1d9980a1))





# [3.8.0-beta.70](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.69...v3.8.0-beta.70) (2024-04-05)


### Features

* **measurement:** Add support measurement label autocompletion ([#3855](https://github.com/OHIF/Viewers/issues/3855)) ([56b1eae](https://github.com/OHIF/Viewers/commit/56b1eae6356a6534960df1196bdd1e95b0a9a470))





# [3.8.0-beta.69](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.68...v3.8.0-beta.69) (2024-04-03)


### Bug Fixes

* **presentation-state:** Iterate over map properly to restore the presentation state ([#4013](https://github.com/OHIF/Viewers/issues/4013)) ([fa38e6a](https://github.com/OHIF/Viewers/commit/fa38e6a07a259d8cb33277922884e722414ac548))





# [3.8.0-beta.68](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.67...v3.8.0-beta.68) (2024-04-03)


### Features

* **segmentation:** Enhanced segmentation panel design for TMTV ([#3988](https://github.com/OHIF/Viewers/issues/3988)) ([9f3235f](https://github.com/OHIF/Viewers/commit/9f3235ff096636aafa88d8a42859e8dc85d9036d))





# [3.8.0-beta.67](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.66...v3.8.0-beta.67) (2024-04-02)


### Features

* **ViewportActionMenu:** window level per viewport / new patient info / colorbars/ 3D presets and 3D volume rendering ([#3963](https://github.com/OHIF/Viewers/issues/3963)) ([b7f90e3](https://github.com/OHIF/Viewers/commit/b7f90e3951845396f99b69f0a74fc56b2ffeada1))





# [3.8.0-beta.66](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.65...v3.8.0-beta.66) (2024-03-28)


### Bug Fixes

* **new layout:** address black screen bugs ([#4008](https://github.com/OHIF/Viewers/issues/4008)) ([158a181](https://github.com/OHIF/Viewers/commit/158a1816703e0ad66cae08cb9bd1ffb93bbd8d43))





# [3.8.0-beta.65](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.64...v3.8.0-beta.65) (2024-03-28)


### Features

* **layout:** new layout selector with 3D volume rendering ([#3923](https://github.com/OHIF/Viewers/issues/3923)) ([617043f](https://github.com/OHIF/Viewers/commit/617043fe0da5de91fbea4ac33a27f1df16ae1ca6))





# [3.8.0-beta.64](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.63...v3.8.0-beta.64) (2024-03-27)


### Features

* **toolbar:** new Toolbar to enable reactive state synchronization ([#3983](https://github.com/OHIF/Viewers/issues/3983)) ([566b25a](https://github.com/OHIF/Viewers/commit/566b25a54425399096864bd263193646556011a5))





# [3.8.0-beta.63](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.62...v3.8.0-beta.63) (2024-03-25)


### Features

* **worklist:** new investigational use text ([#3999](https://github.com/OHIF/Viewers/issues/3999)) ([45b68e8](https://github.com/OHIF/Viewers/commit/45b68e841dcb9e28a2ea991c37ee7ac4a8c5b71e))





# [3.8.0-beta.62](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.61...v3.8.0-beta.62) (2024-03-19)


### Features

* **worklist:** New worklist buttons and tooltips ([#3989](https://github.com/OHIF/Viewers/issues/3989)) ([9bcd1ae](https://github.com/OHIF/Viewers/commit/9bcd1ae6f51d61786cc1e99624f396b56a47cd69))





# [3.8.0-beta.61](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.60...v3.8.0-beta.61) (2024-03-18)


### Bug Fixes

* **SR display:** and the token based navigation ([#3995](https://github.com/OHIF/Viewers/issues/3995)) ([feed230](https://github.com/OHIF/Viewers/commit/feed2304c124dc2facc7a7371ed9851548c223c5))





# [3.8.0-beta.60](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.59...v3.8.0-beta.60) (2024-03-15)


### Features

* **delete measurement:** icon for measurement table ([#3775](https://github.com/OHIF/Viewers/issues/3775)) ([f7fe91c](https://github.com/OHIF/Viewers/commit/f7fe91c5f6c4f05f3f3f5f640d3a119bd40a5870))





# [3.8.0-beta.59](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.58...v3.8.0-beta.59) (2024-03-08)


### Bug Fixes

* **cli:** mode creation template ([#3876](https://github.com/OHIF/Viewers/issues/3876)) ([#3981](https://github.com/OHIF/Viewers/issues/3981)) ([e485d68](https://github.com/OHIF/Viewers/commit/e485d68fd4619ce7187113cbe59e47f9523dbcc8))





# [3.8.0-beta.58](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.57...v3.8.0-beta.58) (2024-03-05)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.57](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.56...v3.8.0-beta.57) (2024-02-28)


### Bug Fixes

* **docs:** Minor typos in hpModule.md ([#3962](https://github.com/OHIF/Viewers/issues/3962)) ([4cdfdae](https://github.com/OHIF/Viewers/commit/4cdfdae8149166cf9dc91a55c0d7f2a224e55d8f))





# [3.8.0-beta.56](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.55...v3.8.0-beta.56) (2024-02-22)


### Bug Fixes

* **demo:** Deploy issue ([#3951](https://github.com/OHIF/Viewers/issues/3951)) ([21e8a2b](https://github.com/OHIF/Viewers/commit/21e8a2bd0b7cc72f90a31e472d285d761be15d30))





# [3.8.0-beta.55](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.54...v3.8.0-beta.55) (2024-02-21)


### Features

* **resize:** Optimize resizing process and maintain zoom level ([#3889](https://github.com/OHIF/Viewers/issues/3889)) ([b3a0faf](https://github.com/OHIF/Viewers/commit/b3a0faf5f5f0a1993b2b017eb4cc1216164ea2c6))





# [3.8.0-beta.54](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.53...v3.8.0-beta.54) (2024-02-14)


### Features

* **errorboundary:** format stack trace properly ([#3931](https://github.com/OHIF/Viewers/issues/3931)) ([0eac386](https://github.com/OHIF/Viewers/commit/0eac386a31a5d6965536360aa65a44769c1a5740))





# [3.8.0-beta.53](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.52...v3.8.0-beta.53) (2024-02-05)


### Bug Fixes

* 🐛 Sort merge results based on default data source (input) ([#3903](https://github.com/OHIF/Viewers/issues/3903)) ([5bba98e](https://github.com/OHIF/Viewers/commit/5bba98ed848bdf46b5ba4fc4708527cced3308b5))





# [3.8.0-beta.52](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.51...v3.8.0-beta.52) (2024-01-22)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.51](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.50...v3.8.0-beta.51) (2024-01-22)


### Bug Fixes

* catch errors in getPTImageIdInstanceMetadata ([#3897](https://github.com/OHIF/Viewers/issues/3897)) ([a47aeb8](https://github.com/OHIF/Viewers/commit/a47aeb8bd729dcb8d2cfc13b27a31b0dd88f11ad))





# [3.8.0-beta.50](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.49...v3.8.0-beta.50) (2024-01-22)


### Bug Fixes

* **viewport-sync:** remember synced viewports bw stack and volume and RENAME StackImageSync to ImageSliceSync ([#3849](https://github.com/OHIF/Viewers/issues/3849)) ([e4a116b](https://github.com/OHIF/Viewers/commit/e4a116b074fcb85c8cbcc9db44fdec565f3386db))





# [3.8.0-beta.49](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.48...v3.8.0-beta.49) (2024-01-19)


### Bug Fixes

* is same orientaiton ([#3905](https://github.com/OHIF/Viewers/issues/3905)) ([31b837f](https://github.com/OHIF/Viewers/commit/31b837fa90f631d4984482c6e952373fbb8bdbfc))





# [3.8.0-beta.48](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.47...v3.8.0-beta.48) (2024-01-17)


### Bug Fixes

* 🐛 Check merge key for merge data source ([#3901](https://github.com/OHIF/Viewers/issues/3901)) ([911d672](https://github.com/OHIF/Viewers/commit/911d67283536b2fe7930948f2819ea0ad66e2a32))





# [3.8.0-beta.47](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.46...v3.8.0-beta.47) (2024-01-12)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.46](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.45...v3.8.0-beta.46) (2024-01-12)


### Bug Fixes

* Update CS3D to fix second render ([#3892](https://github.com/OHIF/Viewers/issues/3892)) ([d00a86b](https://github.com/OHIF/Viewers/commit/d00a86b022742ea089d246d06cfd691f43b64412))





# [3.8.0-beta.45](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.44...v3.8.0-beta.45) (2024-01-09)


### Features

* **hp:** enable OHIF to run with partial metadata for large studies at the cost of less effective hanging protocol ([#3804](https://github.com/OHIF/Viewers/issues/3804)) ([0049f4c](https://github.com/OHIF/Viewers/commit/0049f4c0303f0b6ea995972326fc8784259f5a47))





# [3.8.0-beta.44](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.43...v3.8.0-beta.44) (2024-01-09)


### Features

* **transferSyntax:** prefer server transcoded transfer syntax for all images ([#3883](https://github.com/OHIF/Viewers/issues/3883)) ([1456a49](https://github.com/OHIF/Viewers/commit/1456a493d66c90c787b022256c9f2846afb115fc))





# [3.8.0-beta.43](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.42...v3.8.0-beta.43) (2024-01-09)


### Bug Fixes

* **segmentation:** upgrade cs3d to fix various segmentation bugs ([#3885](https://github.com/OHIF/Viewers/issues/3885)) ([b1efe40](https://github.com/OHIF/Viewers/commit/b1efe40aa146e4052cc47b3f774cabbb47a8d1a6))





# [3.8.0-beta.42](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.41...v3.8.0-beta.42) (2024-01-08)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.41](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.40...v3.8.0-beta.41) (2024-01-08)


### Features

* Add on mode init hook ([#3882](https://github.com/OHIF/Viewers/issues/3882)) ([f58725c](https://github.com/OHIF/Viewers/commit/f58725ce40685f7297181ef98d81bc28420c8291))





# [3.8.0-beta.40](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.39...v3.8.0-beta.40) (2024-01-08)


### Features

* **ui:** sidePanel expandedWidth ([#3728](https://github.com/OHIF/Viewers/issues/3728)) ([61bf22c](https://github.com/OHIF/Viewers/commit/61bf22c6f80e764bdf5c3b56bb0124a95aa0f793))





# [3.8.0-beta.39](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.38...v3.8.0-beta.39) (2024-01-08)


### Features

* improve disableEditing flag ([#3875](https://github.com/OHIF/Viewers/issues/3875)) ([2049c09](https://github.com/OHIF/Viewers/commit/2049c0936c86f819604c243d3dc7b3fe971b5b2c))





# [3.8.0-beta.38](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.37...v3.8.0-beta.38) (2024-01-08)


### Bug Fixes

* convert radian to degree value for mip rotation ([#3881](https://github.com/OHIF/Viewers/issues/3881)) ([bf846c9](https://github.com/OHIF/Viewers/commit/bf846c94c378f04b9f44dcd71be3f056dbcfe0b5))
* PDF display request in v3 ([#3878](https://github.com/OHIF/Viewers/issues/3878)) ([9865030](https://github.com/OHIF/Viewers/commit/98650302c7575f0aea386e32cfc4112c378035e6))





# [3.8.0-beta.37](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.36...v3.8.0-beta.37) (2024-01-08)


### Bug Fixes

* colormap for stack viewports via HangingProtocol ([#3866](https://github.com/OHIF/Viewers/issues/3866)) ([e8858f3](https://github.com/OHIF/Viewers/commit/e8858f3eb55552f695af4a55980f9ae2e9af7291))





# [3.8.0-beta.36](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.35...v3.8.0-beta.36) (2023-12-15)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.35](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.34...v3.8.0-beta.35) (2023-12-14)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.34](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.33...v3.8.0-beta.34) (2023-12-13)


### Bug Fixes

* **icon-style:** Ensure consistent icon dimensions ([#3727](https://github.com/OHIF/Viewers/issues/3727)) ([6ca13c0](https://github.com/OHIF/Viewers/commit/6ca13c0a4cb5a95bbb52b0db902b5dbf72f8aa6e))


### Features

* **overlay:** add inline binary overlays ([#3852](https://github.com/OHIF/Viewers/issues/3852)) ([0177b62](https://github.com/OHIF/Viewers/commit/0177b625ba86760168bc4db58c8a109aa9ee83cb))





# [3.8.0-beta.33](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.32...v3.8.0-beta.33) (2023-12-13)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.32](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.31...v3.8.0-beta.32) (2023-12-13)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.31](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.30...v3.8.0-beta.31) (2023-12-13)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.30](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.29...v3.8.0-beta.30) (2023-12-13)


### Features

* **customizationService:** Enable saving and loading of private tags in SRs ([#3842](https://github.com/OHIF/Viewers/issues/3842)) ([e1f55e6](https://github.com/OHIF/Viewers/commit/e1f55e65f2d2a34136ad5d0b1ada77d337a0ea23))





# [3.8.0-beta.29](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.28...v3.8.0-beta.29) (2023-12-13)


### Bug Fixes

* address and improve system vulnerabilities ([#3851](https://github.com/OHIF/Viewers/issues/3851)) ([805c532](https://github.com/OHIF/Viewers/commit/805c53270f243ec61f142a3ffa0af500021cd5ec))


### Features

* **config:** Add activateViewportBeforeInteraction parameter for viewport interaction customization ([#3847](https://github.com/OHIF/Viewers/issues/3847)) ([f707b4e](https://github.com/OHIF/Viewers/commit/f707b4ebc996f379cd30337badc06b07e6e35ac5))
* **i18n:** enhanced i18n support ([#3761](https://github.com/OHIF/Viewers/issues/3761)) ([d14a8f0](https://github.com/OHIF/Viewers/commit/d14a8f0199db95cd9e85866a011b64d6bf830d57))





# [3.8.0-beta.28](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.27...v3.8.0-beta.28) (2023-12-08)


### Features

* **HP:** Added new 3D hanging protocols to be used in the new layout selector ([#3844](https://github.com/OHIF/Viewers/issues/3844)) ([59576d6](https://github.com/OHIF/Viewers/commit/59576d695d4d26601d35c43f73d602f0b12d72bf))





# [3.8.0-beta.27](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.26...v3.8.0-beta.27) (2023-12-06)


### Bug Fixes

* **auth:** fix the issue with oauth at a non root path ([#3840](https://github.com/OHIF/Viewers/issues/3840)) ([6651008](https://github.com/OHIF/Viewers/commit/6651008fbb35dabd5991c7f61128e6ef324012df))





# [3.8.0-beta.26](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.25...v3.8.0-beta.26) (2023-11-28)


### Bug Fixes

* **SM:** drag and drop is now fixed for SM ([#3813](https://github.com/OHIF/Viewers/issues/3813)) ([f1a6764](https://github.com/OHIF/Viewers/commit/f1a67647aed635437b188cea7cf5d5a8fb974bbe))





# [3.8.0-beta.25](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.24...v3.8.0-beta.25) (2023-11-27)


### Bug Fixes

* **cine:** Set cine disabled on mode exit. ([#3812](https://github.com/OHIF/Viewers/issues/3812)) ([924affa](https://github.com/OHIF/Viewers/commit/924affa7b5d420c2f91522a075cecbb3c78e8f52))





# [3.8.0-beta.24](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.23...v3.8.0-beta.24) (2023-11-24)


### Bug Fixes

* Update the CS3D packages to add the most recent HTJ2K TSUIDS ([#3806](https://github.com/OHIF/Viewers/issues/3806)) ([9d1884d](https://github.com/OHIF/Viewers/commit/9d1884d7d8b6b2a1cdc26965a96995838aa72682))





# [3.8.0-beta.23](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.22...v3.8.0-beta.23) (2023-11-24)


### Features

* Merge Data Source ([#3788](https://github.com/OHIF/Viewers/issues/3788)) ([c4ff2c2](https://github.com/OHIF/Viewers/commit/c4ff2c2f09546ce8b72eab9c5e7beed611e3cab0))





# [3.8.0-beta.22](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.21...v3.8.0-beta.22) (2023-11-21)


### Features

* **events:** broadcast series summary metadata ([#3798](https://github.com/OHIF/Viewers/issues/3798)) ([404b0a5](https://github.com/OHIF/Viewers/commit/404b0a5d535182d1ae44e33f7232db500a7b2c16))





# [3.8.0-beta.21](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.20...v3.8.0-beta.21) (2023-11-21)


### Bug Fixes

* **DICOM Overlay:** The overlay data wasn't being refreshed on change ([#3793](https://github.com/OHIF/Viewers/issues/3793)) ([00e7519](https://github.com/OHIF/Viewers/commit/00e751933ac6d611a34773fa69594243f1b99082))





# [3.8.0-beta.20](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.19...v3.8.0-beta.20) (2023-11-21)


### Bug Fixes

* **metadata:** to handle cornerstone3D update for htj2k ([#3783](https://github.com/OHIF/Viewers/issues/3783)) ([8c8924a](https://github.com/OHIF/Viewers/commit/8c8924af373d906773f5db20defe38628cacd4a0))





# [3.8.0-beta.19](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.18...v3.8.0-beta.19) (2023-11-18)


### Features

* **docs:** Added various training videos to support the OHIF CLI tools ([#3794](https://github.com/OHIF/Viewers/issues/3794)) ([d83beb7](https://github.com/OHIF/Viewers/commit/d83beb7c62c1d5be19c54e08d23883f112147fe1))





# [3.8.0-beta.18](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.17...v3.8.0-beta.18) (2023-11-15)


### Features

* **url:** Add SeriesInstanceUIDs wado query param ([#3746](https://github.com/OHIF/Viewers/issues/3746)) ([b694228](https://github.com/OHIF/Viewers/commit/b694228dd535e4b97cb86a1dc085b6e8716bdaf3))





# [3.8.0-beta.17](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.16...v3.8.0-beta.17) (2023-11-13)


### Bug Fixes

* 🐛 Run error handler for failed image requests ([#3773](https://github.com/OHIF/Viewers/issues/3773)) ([3234014](https://github.com/OHIF/Viewers/commit/323401418e7ccab74655ba02f990bbe0ed4e523b))





# [3.8.0-beta.16](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.15...v3.8.0-beta.16) (2023-11-13)


### Bug Fixes

* **overlay:** Overlays aren't shown on undefined origin ([#3781](https://github.com/OHIF/Viewers/issues/3781)) ([fd1251f](https://github.com/OHIF/Viewers/commit/fd1251f751d8147b8a78c7f4d81c67ba69769afa))





# [3.8.0-beta.15](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.14...v3.8.0-beta.15) (2023-11-10)


### Features

* **dicomJSON:** Add Loading Other Display Sets and JSON Metadata Generation script ([#3777](https://github.com/OHIF/Viewers/issues/3777)) ([43b1c17](https://github.com/OHIF/Viewers/commit/43b1c17209502e4876ad59bae09ed9442eda8024))





# [3.8.0-beta.14](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.13...v3.8.0-beta.14) (2023-11-10)


### Bug Fixes

* **path:** upgrade docusaurus for security ([#3780](https://github.com/OHIF/Viewers/issues/3780)) ([8bbcd0e](https://github.com/OHIF/Viewers/commit/8bbcd0e692e25917c1b6dd94a39fac834c812fca))





# [3.8.0-beta.13](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.12...v3.8.0-beta.13) (2023-11-09)


### Bug Fixes

* **arrow:** ArrowAnnotate text key cause validation error ([#3771](https://github.com/OHIF/Viewers/issues/3771)) ([8af1046](https://github.com/OHIF/Viewers/commit/8af10468035f1f59e0a21e579d50ad63c8cbf7ad))





# [3.8.0-beta.12](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.11...v3.8.0-beta.12) (2023-11-08)


### Features

* add VolumeViewport rotation ([#3776](https://github.com/OHIF/Viewers/issues/3776)) ([442f99d](https://github.com/OHIF/Viewers/commit/442f99d5eb2ceece7def20e14da59af1dd7d8442))





# [3.8.0-beta.11](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.10...v3.8.0-beta.11) (2023-11-08)


### Features

* **hp callback:** Add viewport ready callback ([#3772](https://github.com/OHIF/Viewers/issues/3772)) ([bf252bc](https://github.com/OHIF/Viewers/commit/bf252bcec2aae3a00479fdcb732110b344bcf2c0))





# [3.8.0-beta.10](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.9...v3.8.0-beta.10) (2023-11-03)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.9](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.8...v3.8.0-beta.9) (2023-11-02)


### Bug Fixes

* **thumbnail:** Avoid multiple promise creations for thumbnails ([#3756](https://github.com/OHIF/Viewers/issues/3756)) ([b23eeff](https://github.com/OHIF/Viewers/commit/b23eeff93745769e67e60c33d75293d6242c5ec9))





# [3.8.0-beta.8](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.7...v3.8.0-beta.8) (2023-10-31)


### Features

* **i18n:** enhanced i18n support ([#3730](https://github.com/OHIF/Viewers/issues/3730)) ([330e11c](https://github.com/OHIF/Viewers/commit/330e11c7ff0151e1096e19b8ffdae7d64cae280e))





# [3.8.0-beta.7](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.6...v3.8.0-beta.7) (2023-10-30)


### Bug Fixes

* **measurement service:** Implemented correct check of schema keys in _isValidMeasurment. ([#3750](https://github.com/OHIF/Viewers/issues/3750)) ([db39585](https://github.com/OHIF/Viewers/commit/db395852b6fc6cd5c265a9282e5eee5bd6f951b7))


### Features

* **filters:** save worklist query filters to session storage so that they persist between navigation to the viewer and back ([#3749](https://github.com/OHIF/Viewers/issues/3749)) ([2a15ef0](https://github.com/OHIF/Viewers/commit/2a15ef0e44b7b4d8bbf5cb9363db6e523201c681))





# [3.8.0-beta.6](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.5...v3.8.0-beta.6) (2023-10-25)


### Bug Fixes

* **toolbar:** allow customizable toolbar for active viewport and allow active tool to be deactivated via a click ([#3608](https://github.com/OHIF/Viewers/issues/3608)) ([dd6d976](https://github.com/OHIF/Viewers/commit/dd6d9768bbca1d3cc472e8c1e6d85822500b96ef))





# [3.8.0-beta.5](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.4...v3.8.0-beta.5) (2023-10-24)


### Bug Fixes

* **sr:** dcm4chee requires the patient name for an SR to match what is in the original study ([#3739](https://github.com/OHIF/Viewers/issues/3739)) ([d98439f](https://github.com/OHIF/Viewers/commit/d98439fe7f3825076dbc87b664a1d1480ff414d3))





# [3.8.0-beta.4](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.3...v3.8.0-beta.4) (2023-10-23)

**Note:** Version bump only for package ohif-monorepo-root





# [3.8.0-beta.3](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.2...v3.8.0-beta.3) (2023-10-23)


### Bug Fixes

* **recipes:** package.json script orthanc:up docker-compose path ([#3741](https://github.com/OHIF/Viewers/issues/3741)) ([49514ae](https://github.com/OHIF/Viewers/commit/49514aedfe0498b5bd505193106a9745a6a5b5e6))





# [3.8.0-beta.2](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.1...v3.8.0-beta.2) (2023-10-19)


### Bug Fixes

* **cine:** Use the frame rate specified in DICOM and optionally auto play cine ([#3735](https://github.com/OHIF/Viewers/issues/3735)) ([d9258ec](https://github.com/OHIF/Viewers/commit/d9258eca70587cf4dc18be4e56c79b16bae73d6d))





# [3.8.0-beta.1](https://github.com/OHIF/Viewers/compare/v3.8.0-beta.0...v3.8.0-beta.1) (2023-10-19)


### Bug Fixes

* **calibration:** No calibration popup caused by perhaps an unused code optimization for production builds ([#3736](https://github.com/OHIF/Viewers/issues/3736)) ([93d798d](https://github.com/OHIF/Viewers/commit/93d798db99c0dee53ef73c376f8a74ac3049cf3f))





# [3.8.0-beta.0](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.110...v3.8.0-beta.0) (2023-10-12)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.110](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.109...v3.7.0-beta.110) (2023-10-11)


### Bug Fixes

* **display messages:** broken after timings ([#3719](https://github.com/OHIF/Viewers/issues/3719)) ([157b88c](https://github.com/OHIF/Viewers/commit/157b88c909d3289cb89ace731c1f9a19d40797ac))





# [3.7.0-beta.109](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.108...v3.7.0-beta.109) (2023-10-11)


### Bug Fixes

* **export:** wrong export for the tmtv RT function ([#3715](https://github.com/OHIF/Viewers/issues/3715)) ([a3f2a1a](https://github.com/OHIF/Viewers/commit/a3f2a1a7b0d16bfcc0ecddc2ab731e54c5e377c8))





# [3.7.0-beta.108](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.107...v3.7.0-beta.108) (2023-10-10)


### Bug Fixes

* **i18n:** display set(s) are two words for English messages ([#3711](https://github.com/OHIF/Viewers/issues/3711)) ([c3a5847](https://github.com/OHIF/Viewers/commit/c3a5847dcd3dce4f1c8d8b11af95f79e3f93f70d))





# [3.7.0-beta.107](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.106...v3.7.0-beta.107) (2023-10-10)


### Bug Fixes

* **modules:** add stylus loader as an option to be uncommented ([#3710](https://github.com/OHIF/Viewers/issues/3710)) ([7c57f67](https://github.com/OHIF/Viewers/commit/7c57f67844b790fc6e47ac3f9708bf9d576389c8))





# [3.7.0-beta.106](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.105...v3.7.0-beta.106) (2023-10-10)


### Bug Fixes

* **segmentation:**  Various fixes for segmentation mode and other ([#3709](https://github.com/OHIF/Viewers/issues/3709)) ([a9a6ad5](https://github.com/OHIF/Viewers/commit/a9a6ad50eae67b43b8b34efc07182d788cacdcfe))





# [3.7.0-beta.105](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.104...v3.7.0-beta.105) (2023-10-10)


### Bug Fixes

* **voi:** should publish voi change event on reset ([#3707](https://github.com/OHIF/Viewers/issues/3707)) ([52f34c6](https://github.com/OHIF/Viewers/commit/52f34c64d014f433ec1661a39b47e7fb27f15332))





# [3.7.0-beta.104](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.103...v3.7.0-beta.104) (2023-10-09)


### Bug Fixes

* **modality unit:** fix the modality unit per target via upgrade of cs3d ([#3706](https://github.com/OHIF/Viewers/issues/3706)) ([0a42d57](https://github.com/OHIF/Viewers/commit/0a42d573bbca7f2551a831a46d3aa6b56674a580))





# [3.7.0-beta.103](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.102...v3.7.0-beta.103) (2023-10-09)


### Bug Fixes

* **segmentation:** do not use SAB if not specified ([#3705](https://github.com/OHIF/Viewers/issues/3705)) ([4911e47](https://github.com/OHIF/Viewers/commit/4911e4796cef5e22cb7cc0ca73dc5c956bc75339))





# [3.7.0-beta.102](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.101...v3.7.0-beta.102) (2023-10-06)


### Features

* **Segmentation:** download RTSS from Labelmap([#3692](https://github.com/OHIF/Viewers/issues/3692)) ([40673f6](https://github.com/OHIF/Viewers/commit/40673f64b36b1150149c55632aa1825178a39e65))





# [3.7.0-beta.101](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.100...v3.7.0-beta.101) (2023-10-06)


### Bug Fixes

* **bugs:** fixing lots of bugs regarding release candidate ([#3700](https://github.com/OHIF/Viewers/issues/3700)) ([8bc12a3](https://github.com/OHIF/Viewers/commit/8bc12a37d0353160ae5ea4624dc0b244b7d59c07))





# [3.7.0-beta.100](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.99...v3.7.0-beta.100) (2023-10-06)


### Bug Fixes

* **segmentation scroll:** and hydration bugs ([#3701](https://github.com/OHIF/Viewers/issues/3701)) ([1fd98d9](https://github.com/OHIF/Viewers/commit/1fd98d922094d10fe0c6e9df726314ec9fce49e8))





# [3.7.0-beta.99](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.98...v3.7.0-beta.99) (2023-10-04)


### Bug Fixes

* **measurement and microscopy:**  various small fixes for measurement and microscopy side panel ([#3696](https://github.com/OHIF/Viewers/issues/3696)) ([c1d5ee7](https://github.com/OHIF/Viewers/commit/c1d5ee7e3f7f4c0c6bed9ae81eba5519741c5155))





# [3.7.0-beta.98](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.97...v3.7.0-beta.98) (2023-10-04)


### Features

* **locale:** add German translations - community PR ([#3697](https://github.com/OHIF/Viewers/issues/3697)) ([ebe8f71](https://github.com/OHIF/Viewers/commit/ebe8f71da22c1d24b58f889c5d803951e19817b6))





# [3.7.0-beta.97](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.96...v3.7.0-beta.97) (2023-10-04)


### Features

* **locale:** Added Turkish language support (tr-TR) - Community PR ([#3695](https://github.com/OHIF/Viewers/issues/3695)) ([745050a](https://github.com/OHIF/Viewers/commit/745050a28ec7c2ef2e9a4d4e590040050b2177b2))





# [3.7.0-beta.96](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.95...v3.7.0-beta.96) (2023-10-04)


### Bug Fixes

* **translation:** Side panel translate fix ([#3156](https://github.com/OHIF/Viewers/issues/3156)) ([29748d4](https://github.com/OHIF/Viewers/commit/29748d46a14d23817dbe196e0f64363fc61a8aed))





# [3.7.0-beta.95](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.94...v3.7.0-beta.95) (2023-10-04)


### Bug Fixes

* **cli:** Add npm packaged mode not working ([#3689](https://github.com/OHIF/Viewers/issues/3689)) ([28cec04](https://github.com/OHIF/Viewers/commit/28cec04ff43b81e218c3e9addef4665b3833a6fe))





# [3.7.0-beta.94](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.93...v3.7.0-beta.94) (2023-10-03)


### Features

* **debug:** Add timing information about time to first image/all images, and query time ([#3681](https://github.com/OHIF/Viewers/issues/3681)) ([108383b](https://github.com/OHIF/Viewers/commit/108383b9ef51e4bef82d9c932b9bc7aa5354e799))





# [3.7.0-beta.93](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.92...v3.7.0-beta.93) (2023-10-03)


### Features

* **displayArea:** add display area to hanging protocol ([#3691](https://github.com/OHIF/Viewers/issues/3691)) ([5e7fe91](https://github.com/OHIF/Viewers/commit/5e7fe91617d7399f85702d82e7bfa028b8010a89))





# [3.7.0-beta.92](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.91...v3.7.0-beta.92) (2023-10-03)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.91](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.90...v3.7.0-beta.91) (2023-10-03)


### Bug Fixes

* **editing:** regression bug in disable editing ([#3687](https://github.com/OHIF/Viewers/issues/3687)) ([4dc2acd](https://github.com/OHIF/Viewers/commit/4dc2acdefa872dd1d8df47f465e9e9656f95f67f))





# [3.7.0-beta.90](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.89...v3.7.0-beta.90) (2023-10-03)


### Bug Fixes

* **typescript error:** Change pubSubServiceInterface file type to typescript ([#3546](https://github.com/OHIF/Viewers/issues/3546)) ([eb22328](https://github.com/OHIF/Viewers/commit/eb22328fc05d06fc4411805e7a30f826659d796a))





# [3.7.0-beta.89](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.88...v3.7.0-beta.89) (2023-10-03)


### Bug Fixes

* **dicom overlay:** Handle special cases of ArrayBuffer for various DICOM overlay attributes. ([#3684](https://github.com/OHIF/Viewers/issues/3684)) ([e36a604](https://github.com/OHIF/Viewers/commit/e36a6043315e900eeb6ce183772c7f852f478e96))
* **StackSync:** Miscellaneous fixes for stack image sync ([#3663](https://github.com/OHIF/Viewers/issues/3663)) ([8a335bd](https://github.com/OHIF/Viewers/commit/8a335bd03d14ba87d65d7468d93f74040aa828d9))





# [3.7.0-beta.88](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.87...v3.7.0-beta.88) (2023-10-03)


### Bug Fixes

* **config:** support more values for the useSharedArrayBuffer ([#3688](https://github.com/OHIF/Viewers/issues/3688)) ([1129c15](https://github.com/OHIF/Viewers/commit/1129c155d2c7d46c98a5df7c09879aa3d459fa7e))





# [3.7.0-beta.87](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.86...v3.7.0-beta.87) (2023-09-29)


### Bug Fixes

* **no sab:** should work when shared array buffer is not required ([#3686](https://github.com/OHIF/Viewers/issues/3686)) ([a67d72d](https://github.com/OHIF/Viewers/commit/a67d72de85238b369a18c010bf6d147daefc6df5))





# [3.7.0-beta.86](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.85...v3.7.0-beta.86) (2023-09-29)


### Bug Fixes

* **cli:** various fixes for adding custom modes and extensions ([#3683](https://github.com/OHIF/Viewers/issues/3683)) ([dc73b18](https://github.com/OHIF/Viewers/commit/dc73b187484da029a2664bb1302f30137c973b8c))





# [3.7.0-beta.85](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.84...v3.7.0-beta.85) (2023-09-26)


### Bug Fixes

* **toggleOneUp:** fixed one up for main tmtv layout ([#3677](https://github.com/OHIF/Viewers/issues/3677)) ([86f54d0](https://github.com/OHIF/Viewers/commit/86f54d0d07042750a863ae876aa8dd5fb16029a5))





# [3.7.0-beta.84](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.83...v3.7.0-beta.84) (2023-09-26)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.83](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.82...v3.7.0-beta.83) (2023-09-26)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.82](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.81...v3.7.0-beta.82) (2023-09-26)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.81](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.80...v3.7.0-beta.81) (2023-09-26)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.80](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.79...v3.7.0-beta.80) (2023-09-22)


### Bug Fixes

* **react-select:** update react select package ([#3622](https://github.com/OHIF/Viewers/issues/3622)) ([04ca10d](https://github.com/OHIF/Viewers/commit/04ca10d8779dd15454920002f3d48afa8830de8a))


### Features

* **segmentation mode:** Add create, and export SEG with Brushes ([#3632](https://github.com/OHIF/Viewers/issues/3632)) ([48bbd62](https://github.com/OHIF/Viewers/commit/48bbd6281a497ea68670239f5426a10ee6c56dc1))
* **SidePanel:** new side panel tab look-and-feel ([#3657](https://github.com/OHIF/Viewers/issues/3657)) ([85c899b](https://github.com/OHIF/Viewers/commit/85c899b399e2521480724be145538993721b9378))





# [3.7.0-beta.79](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.78...v3.7.0-beta.79) (2023-09-22)


### Performance Improvements

* **memory:** add 16 bit texture via configuration - reduces memory by half ([#3662](https://github.com/OHIF/Viewers/issues/3662)) ([2bd3b26](https://github.com/OHIF/Viewers/commit/2bd3b26a6aa54b211ef988f3ad64ef1fe5648bab))





# [3.7.0-beta.78](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.77...v3.7.0-beta.78) (2023-09-21)


### Bug Fixes

* **mpr:** Return the original/raw hanging protocol when fetching and preserving the current active protocol. ([#3670](https://github.com/OHIF/Viewers/issues/3670)) ([221dedd](https://github.com/OHIF/Viewers/commit/221dedde5dd4df086276406a9fa2da1cc23b4eb1))





# [3.7.0-beta.77](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.76...v3.7.0-beta.77) (2023-09-21)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.76](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.75...v3.7.0-beta.76) (2023-09-19)


### Bug Fixes

* **keyCloak:** fix openresty keycloak deployment recipe ([#3655](https://github.com/OHIF/Viewers/issues/3655)) ([2d7721c](https://github.com/OHIF/Viewers/commit/2d7721cb581f55dc49e3baeca2411b18dd78ad74))





# [3.7.0-beta.75](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.74...v3.7.0-beta.75) (2023-09-18)


### Bug Fixes

* **DicomJson:** retrieve.series.metadata method should be async ([#3659](https://github.com/OHIF/Viewers/issues/3659)) ([2737903](https://github.com/OHIF/Viewers/commit/2737903386cf97399473e0fa64fe53ad14da155a))





# [3.7.0-beta.74](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.73...v3.7.0-beta.74) (2023-09-15)


### Bug Fixes

* **measurements:** Update the calibration tool to match changes in CS3D ([#3505](https://github.com/OHIF/Viewers/issues/3505)) ([38af311](https://github.com/OHIF/Viewers/commit/38af3112ec1f94f36c0ef64ff1cf9d21c0981c81))





# [3.7.0-beta.73](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.72...v3.7.0-beta.73) (2023-09-12)


### Bug Fixes

* **health imaging:** studies not loading from healthimaging if imagepositionpatient is missing ([#3646](https://github.com/OHIF/Viewers/issues/3646)) ([74e62a1](https://github.com/OHIF/Viewers/commit/74e62a176374f720080d4e777972f70e7f2d8b2b))





# [3.7.0-beta.72](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.71...v3.7.0-beta.72) (2023-09-12)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.71](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.70...v3.7.0-beta.71) (2023-09-12)


### Bug Fixes

* **suv:** import calculate-suv library version that prevents SUV calculation for a zero PatientWeight ([#3638](https://github.com/OHIF/Viewers/issues/3638)) ([0d10f46](https://github.com/OHIF/Viewers/commit/0d10f46b885fe54ec3dae1848134da658eb6280a))





# [3.7.0-beta.70](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.69...v3.7.0-beta.70) (2023-09-12)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.69](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.68...v3.7.0-beta.69) (2023-09-11)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.68](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.67...v3.7.0-beta.68) (2023-09-11)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.67](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.66...v3.7.0-beta.67) (2023-09-06)


### Bug Fixes

* **hotkeys:** preserve hotkeys if changed, and reduce re-rendering ([#3635](https://github.com/OHIF/Viewers/issues/3635)) ([94f7cfb](https://github.com/OHIF/Viewers/commit/94f7cfb08e3490488394efc42ef089ebe55e86be))





# [3.7.0-beta.66](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.65...v3.7.0-beta.66) (2023-09-06)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.65](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.64...v3.7.0-beta.65) (2023-09-06)


### Features

* **ImageOverlayViewerTool:** add ImageOverlayViewer tool that can render image overlay (pixel overlay) of the DICOM images ([#3163](https://github.com/OHIF/Viewers/issues/3163)) ([69115da](https://github.com/OHIF/Viewers/commit/69115da06d2d437b57e66608b435bb0bc919a90f))





# [3.7.0-beta.64](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.63...v3.7.0-beta.64) (2023-09-05)


### Bug Fixes

* **nginx archive recipe:** Fixes to various configuration files. ([#3624](https://github.com/OHIF/Viewers/issues/3624)) ([3ce7225](https://github.com/OHIF/Viewers/commit/3ce72254b390f32c9aa207a0589e688805e2659d))





# [3.7.0-beta.63](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.62...v3.7.0-beta.63) (2023-09-01)


### Features

* **grid:** remove viewportIndex and only rely on viewportId ([#3591](https://github.com/OHIF/Viewers/issues/3591)) ([4c6ff87](https://github.com/OHIF/Viewers/commit/4c6ff873e887cc30ffc09223f5cb99e5f94c9cdd))





# [3.7.0-beta.62](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.61...v3.7.0-beta.62) (2023-08-30)


### Features

* **data source UI config:** Popup the configuration dialogue whenever a data source is not fully configured ([#3620](https://github.com/OHIF/Viewers/issues/3620)) ([adedc8c](https://github.com/OHIF/Viewers/commit/adedc8c382e18a2e86a569e3d023cc55a157363f))





# [3.7.0-beta.61](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.60...v3.7.0-beta.61) (2023-08-29)


### Bug Fixes

* **OpenIdConnectRoutes:** fix handleUnauthenticated ([#3617](https://github.com/OHIF/Viewers/issues/3617)) ([35fc30c](https://github.com/OHIF/Viewers/commit/35fc30c5359d8199cc38ffa670c08687d2672f11))





# [3.7.0-beta.60](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.59...v3.7.0-beta.60) (2023-08-29)


### Bug Fixes

* **PT Metadata:** Allow for PatientWeight to be missing from the metadata ([#3621](https://github.com/OHIF/Viewers/issues/3621)) ([44f101d](https://github.com/OHIF/Viewers/commit/44f101d3f2b3204b67e31f4e4939062e65a246ee))





# [3.7.0-beta.59](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.58...v3.7.0-beta.59) (2023-08-29)

**Note:** Version bump only for package ohif-monorepo-root





# [3.7.0-beta.58](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.57...v3.7.0-beta.58) (2023-08-25)


### Features

* **cloud data source config:** GUI and API for configuring a cloud data source with Google cloud healthcare implementation ([#3589](https://github.com/OHIF/Viewers/issues/3589)) ([a336992](https://github.com/OHIF/Viewers/commit/a336992971c07552c9dbb6e1de43169d37762ef1))





# [3.7.0-beta.57](https://github.com/OHIF/Viewers/compare/v3.7.0-beta.56...v3.7.0-beta.57) (2023-08-23)


### Bug Fixes

* **memory leak:** array buffer was sticking around in volume viewports ([#3611](https://github.com/OHIF/Viewers/issues/3611)) ([65b49ae](https://github.com/OHIF/Viewers/commit/65b49aeb1b5f38224e4892bdf32453500ee351f8))
