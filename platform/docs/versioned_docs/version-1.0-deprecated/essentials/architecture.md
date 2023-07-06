---
sidebar_position: 2
---
# Architecture

## Meteor
[Meteor](https://www.meteor.com/) is built on top of [Node.js](https://nodejs.org/en/), adding reactive templates ([Blaze](https://guide.meteor.com/blaze.html)), a [publish/subscribe](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) mechanism (via [WebSockets](https://en.wikipedia.org/wiki/WebSocket) and the [Distributed Data Protocol](https://blog.meteor.com/introducing-ddp-6b40c6aff27d), and a fully integrated client-server [MongoDB](https://www.mongodb.com/) making it easy to create reactive data elements in the UI.

## Structure of an OHIF Application
The OHIF Framework is built as a set of small Meteor packages which can be included as necessary in the final application. Since the logic and templates are largely pushed into packages, the actual application-specific code for each Viewer is relatively short.

In brief, to create a new Viewer application, you need to:
* Define the existing pages and the routes which will lead to them
* Define the overall application layout
* Include child templates from the OHIF Packages into your application layout
* Specify desired template options as necessary (e.g. which tools should appear in the toolbar)

User interface components for your application can be defined in any View layer supported by Meteor (Officially: [Angular](https://www.meteor.com/tutorials/angular/creating-an-app), [React](https://www.meteor.com/tutorials/react/creating-an-app), [Blaze](https://www.meteor.com/tutorials/blaze/creating-an-app), Unofficially: [Vue](https://github.com/meteor-vue/vue-meteor)).
