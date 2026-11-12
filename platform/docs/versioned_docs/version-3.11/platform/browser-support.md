---
sidebar_position: 2
title: Browser Support
summary: Documentation of OHIF's browser compatibility standards, including supported browsers (IE11, Firefox, Chrome, Safari, Edge), transpilation and polyfill strategies, and development priorities focused on modern evergreen browsers.
---
# Browser Support

The browsers that we support are specified in the `.browserlistrc` file located
in the `platform/app` project. While we leverage the latest language features
when writing code, we rely on `babel` to _transpile_ our code so that it can run
in the browsers that we support.

## In Practice

The OHIF Viewer is capable of _running_ on:

- IE 11
- FireFox
- Chrome
- Safari
- Edge

However, we do not have the resources to adequately test and maintain bug free
functionality across all of these. In order to push web based medical imaging
forward, we focus our development efforts on recent version of modern evergreen
browsers.

Our support of older browsers equates to our willingness to review PRs for bug
fixes, and target their minimum JS support whenever possible.

### Polyfills

> A polyfill, or polyfiller, is a piece of code (or plugin) that provides the
> technology that you, the developer, expect the browser to provide natively.

An example of a polyfill is that you expect `Array.prototype.filter` to exist,
but for some reason, the browser that's being used has not implemented that
language feature yet. Our earlier transpilation will rectify _syntax_
discrepancies, but unimplemented features require a "temporary" implementation.
That's where polyfills step in.

We previously used polyfill io, but due to a security vulnerability in the library, it's necessary to switch to alternative services.

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[core-js]: https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md
<!-- prettier-ignore-end -->
