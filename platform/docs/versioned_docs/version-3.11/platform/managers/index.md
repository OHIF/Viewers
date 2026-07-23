---
sidebar_position: 1
sidebar_label: Introduction
title: Managers Introduction
summary: Overview of OHIF's manager system, which handles critical application infrastructure including extension registration, service management, command execution, and hotkey binding to coordinate functionality across the platform.
---

# Managers

## Overview

`OHIF` uses `Managers` to accomplish various purposes such as registering new
services, dependency injection, and aggregating and exposing `extension`
features.

`OHIF-v3` provides the following managers which we will discuss in depth.

<table>
    <thead>
        <tr>
            <th>Manager</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <a href="./extension">
                    Extension Manager
                </a>
            </td>
            <td>
                Aggregating and exposing modules and features through out the app
            </td>
        </tr>
        <tr>
            <td>
                <a href="./service">
                    Services Manager
                </a>
            </td>
            <td>
                Single point of registration for all internal and external services
            </td>
        </tr>
        <tr>
            <td>
                <a href="./commands">
                    Commands Manager
                </a>
            </td>
            <td>
                Register commands with specific context and run commands in the app
            </td>
        </tr>
        <tr>
            <td>
                <a href="./hotkeys">
                    Hotkeys Manager
                </a>
            </td>
            <td>
                For keyboard keys assignment to commands
            </td>
        </tr>
    </tbody>
</table>

<!--
  LINKS
  -->

<!-- prettier-ignore-start -->

[core-services]: https://github.com/OHIF/Viewers/tree/master/platform/core/src/services
[services-manager]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/ServicesManager.js
[cross-cutting-concerns]: https://en.wikipedia.org/wiki/Cross-cutting_concern
<!-- prettier-ignore-end -->
