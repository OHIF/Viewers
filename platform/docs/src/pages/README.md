# How To: Documentation Step-by-Step

We use [GitBook](https://www.gitbook.com/) to create our documentation. It primarily uses markdown, html, css, js, misc. plugins, and configuration to generate high quality, easy to read, and easy to maintain documentation.

## Getting Started

_Requirements:_

Make sure you have the [`gitbook-cli`](https://www.npmjs.com/package/gitbook-cli) installed globally:

> `npm install -g gitbook-cli`

### Editing and Previewing Changes

Currently, you can only edit and preview a single "book" at a time. We maintain one "book" per API major version. You can find each version's book at:

_Past Versions:_

- Template:
  - `<project-root>/docs/v<versionNumber>`
- Examples:
  - `/docs/v1`
  - `/docs/v2`

_Latest Version:_

The latest version will always be located in `/docs/latest`

_Live Preview:_

In your terminal / command prompt:

```bash
cd /docs/latest
gitbook install
gitbook serve
```

Which should generate output like:

> starting server...
> serving book on http://localhost:4000

Navigating to the the provided URL will show a preview of what the generated book should look like. Any edits you make to the book's markdown files should automatically update in your browser.

### Publishing
