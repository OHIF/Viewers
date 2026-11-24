---
sidebar_position: 16
sidebar_label: Dynamic config URLs
title: Dynamic config URLs need an origin list or an anchored pattern
---

# Dynamic config URLs need an origin list or an anchored pattern

This matters only if your app config sets `dangerouslyUseDynamicConfig.enabled: true`,
so that a `?configUrl=` link can load a different configuration.

A dynamic config document controls the data sources and which extensions and modes
the viewer loads, so 3.14 checks the URL more strictly. A `configUrl` that 3.13
accepted can now be refused, and the viewer then starts with its built-in
configuration. A refusal caused by the configuration itself, such as a missing
gate or a pattern without `^`, logs an error that starts with
`dangerouslyUseDynamicConfig: Refusing to load ?configUrl=`. A URL that an
anchored pattern simply doesn't match is ignored without a message, which is
what happens to a pattern written for relative values (below).

## What changed

| | 3.13 | 3.14 |
| --- | --- | --- |
| What is checked | the raw `configUrl` value | the absolute URL the browser will fetch |
| No `regex` | every URL accepted | refused, unless `origins` is set |
| `regex` without a leading `^` | matched anywhere in the URL | refused |
| `regex` with the `m` flag | allowed | refused |
| `origins` | not available | the URL's origin must be in the list |
| Schemes other than `http:`/`https:` | passed to `fetch` | refused |

When both `origins` and `regex` are set, both must pass.

## Update your configuration

Prefer `origins`. It compares the URL's origin exactly, so there is no
pattern to get wrong.

**A catch-all pattern:**

```js
// 3.13
dangerouslyUseDynamicConfig: { enabled: true, regex: /.*/ },

// 3.14: list the origins that serve your config documents
dangerouslyUseDynamicConfig: { enabled: true, origins: ['https://config.hospital.com'] },
```

If you must accept any URL, use the anchored `regex: /^/`. This lets anyone
who can send a user a link choose the code the viewer loads, so avoid it.

**A pattern that names a host:**

```js
// 3.13: also matched https://evil.example/?x=hospital.com
dangerouslyUseDynamicConfig: { enabled: true, regex: /hospital\.com/ },

// 3.14
dangerouslyUseDynamicConfig: { enabled: true, origins: ['https://hospital.com'] },
// or, to also limit the path
dangerouslyUseDynamicConfig: { enabled: true, regex: /^https:\/\/hospital\.com\/configs\// },
```

**A pattern written for relative values:**

```js
// 3.13: matched ?configUrl=/configs/site.json
dangerouslyUseDynamicConfig: { enabled: true, regex: /^\/configs\// },

// 3.14: the pattern sees https://viewer.hospital.com/configs/site.json
dangerouslyUseDynamicConfig: {
  enabled: true,
  regex: /^https:\/\/viewer\.hospital\.com\/configs\//,
},
```

See `dangerouslyUseDynamicConfig` in
[Configuration files](../../configuration/configurationFiles.md) for the full rules.
