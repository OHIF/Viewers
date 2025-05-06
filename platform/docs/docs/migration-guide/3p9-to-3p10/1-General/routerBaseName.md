---
title: routerBaseName
summary: Migration guide for router configuration in OHIF 3.10, covering the updated default behavior of routerBasename and its interaction with PUBLIC_URL, with scenario-based examples for both root and subpath hosting.
---


## Migration Guide: Router Configuration (`routerBasename` and `PUBLIC_URL`)


**Key Changes:**

*   **`routerBasename` Default Value:** The recommended default value for `routerBasename` in the configuration file (`window.config`) has changed from `'/'` to `null`.
*   **New Default Behavior:** If `routerBasename` is set to `null` (or is not defined) in the configuration, the application's base path will now automatically default to the value determined by `PUBLIC_URL`.
*   **Clarified Roles:**
    *   `routerBasename`: Explicitly defines the base path for the application's routes (e.g., `/viewer`). If `null`, it defaults to `PUBLIC_URL`.
    *   `PUBLIC_URL`: Primarily defines the URL prefix from which static assets (like JavaScript files, CSS, images) are loaded. It defaults to `/` if not set.


:::info
see the comprehensive guide [here](/deployment/custom-url-access)
:::

**Migration Steps:**

1.  **Review `routerBasename` Configuration:**
    Locate the `routerBasename` setting within your application configuration file (typically found in `platform/app/public/config/*.js`).

2.  **Update `routerBasename` Based on Hosting Scenario:**

    *   **Scenario A: Hosting at the Root (`/`)**
        If your application is served from the root domain (e.g., `https://example.com/`), it's recommended to update `routerBasename` to `null`. This aligns the routing base with the default asset loading path (`PUBLIC_URL` which defaults to `/`).

        *Example Diff:*
        ```diff
        window.config = {
        -  routerBasename: '/',
        +  routerBasename: null,
           // ... other config options
           showStudyList: true,
           dataSources: [ /* ... */ ],
        ```
        *Explanation:* Setting `routerBasename: null` leverages the new default behavior. The router will use `/` as its base because `PUBLIC_URL` defaults to `/`.

    *   **Scenario B: Hosting at a Subpath (e.g., `/viewer/`)**
        If your application is served from a subpath (e.g., `https://example.com/viewer/`), you should ensure `routerBasename` is explicitly set to that path.

        *Example (No Change Needed if Already Correct):*
        ```diff
        window.config = {
        // No change needed if already set correctly for subpath hosting
           routerBasename: '/viewer',
           // ... other config options
           showStudyList: true,
           dataSources: [ /* ... */ ],
        ```
        *Explanation:* Explicitly setting `routerBasename` ensures the application's internal routing works correctly under the `/viewer/` path.
