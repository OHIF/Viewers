# Frequently Asked Questions - Technical
## Why is your framework built with Meteor?

At the time of project conception, Meteor was a simple way to begin using bleeding edge web technologies without putting significant effort into configuration and build processes. Although Meteor does have some drawbacks, it remains a simple all-in-one solution.

## Do you have any plans to stop using Meteor?

We have considered migrating templates from Blaze (http://blazejs.org/) to React (https://reactjs.org/) or Vue (https://vuejs.org/), simply because these decouple the view layer from the remainder of the application. Blaze currently lacks [Stand-alone Support](http://blazejs.org/#Better-Stand-alone-Support) which means that our templates are not re-usable outside of a Meteor application. This is certainly a downside, but the resource cost to migrate every template is significant.
