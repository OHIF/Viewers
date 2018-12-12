## Contributing

**Submit your Pull Request on a Feature Branch**  

- To ensure your pull-request has the greatest chance of getting merged in, please submit it on a feature branch rather than directly to master.  
- Please see [A successful Git branching model](http://nvie.com/posts/a-successful-git-branching-model/) for more details.

**Quality Assurance**  
- Pull Requests will be generally accepted as long as the QA tests pass on [Circle CI](https://circleci.com/gh/clinical-meteor/clinical-active-entry).
- Begin a Pull Request by logging an Issue for discussion.
- Next, clone the package into a project for local development.
- Use ``git checkout -b newfeature`` to create a new branch.  
- Run the package verification tests to ensure that the test runner works.   
- Add an it() clause at the bottom of the [activeEntryTests.js](https://github.com/clinical-meteor/clinical-active-entry/blob/master/tests/gagarin/activeEntryTests.js) file for each new feature you wish to implement.  
- Sketch out a test script for a feature.
- Run the verification tests, and confirm that the new test fails.  
- Update the package with the new feature until the new test passes.
- Push the package to the repo on GitHub.
- Submit a pull-request.
- If the PR passes tests on Circle CI, we'll merge it in!  

**Reference Implementation**  
- Please see the [ChecklistManifest](http://checklist-manifesto.meteor.com/) and it's [source code](https://github.com/clinical-meteor/checklist-manifesto) for a reference implementation of the ActiveEntry package.  It's being built as a workqueue, and is being designed to be FDA, HIPAA, and HL7 FHIR compliant.  

**Feature Toggling**  
- In general, it's a best practice to implement features that can be enabled/disabled.  Some people will want a feature; others will not.  The best way to toggle features is adding them to a config file, which is what the [ActiveEntry](https://github.com/clinical-meteor/clinical-active-entry/blob/master/lib/ActiveEntry.js) object is for.  
- It's recommended that fields be added to the ActiveEntryConfig object that can be used to enabled/disable the feature you are implementing.
- The ActiveEntryConfig object can be roughly considered as analogous to the ``props`` field that is passed into React templates.  

**Theming and Styling**  
- Different apps require different presentation/style layers, so Clinical Meteor has implemented a [Theme](https://github.com/clinical-meteor/clinical-theming/blob/master/objects/Theme.js) object which manages theming.  Generally speaking, we're trying to avoid the inclusion of third-party component libraries, UI widgets, and CSS frameworks, and keeping the Clinical Meteor packages as close to the default HTML that Blaze produces as possible (while using line styles for animation effects).
- Generally speaking, Bootstrap HTML structure in acceptable in designing pages, but avoid including global CSS files, and keep any CSS locally scoped using LESS nested classes.  This approach allows people to add the Bootstrap library if they want it, prevents cascading leaks, and allows more fine-grained control over CSS to implement animation effects.  
- Pull requests that include visual integration with other projects are acceptable, but please submit an issue for discussion before submitting PRs with wholesale changes that include Jade, Material UI, React, etc.
- The ActiveEntry pages are designed to be used in an IronRouter Layout template.  As such, no height/width constraints are provided.  It's assumed that the layout template will take care of such things.  But basic padding/margin is provided.
