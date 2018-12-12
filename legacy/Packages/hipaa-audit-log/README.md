clinical:hipaa-audit-log
====================================================

HIPAA logging and audit features for Meteor Apps built with Clinical UI.

![HipaaAuditLogScreenshot](https://raw.githubusercontent.com/awatson1978/clinical-hipaa-audit-log/master/screenshots/auditlog.png)

====================================================
#### Installation

The HIPAA audit log is now split into two packages:  one for the logging, and one for the UI.  Please see [``clinical:hipaa-logger``](https://github.com/clinical-meteor/hipaa-logger) for the logging portion.  

````
meteor add clinical:hipaa-audit-log
meteor add clinical:hipaa-logger
````

====================================================
#### URL Routes

Navigate to the audit log via the default route:

````js
Router.go('/audit');
````

====================================================
#### Provided Templates

Three templates are provided by this package:

````html
{{>hipaaAuditLog}}
{{>hipaaRibbon}}
{{>hipaaLogPage}}
````

====================================================
#### Styling and Classes

You can adjust the styling of the audit log through the configuration object.  The following example shows how to style the audit log with Bootstrap controls.

````js
  HipaaAuditLog.configure({
    classes: {
      input: "form-control squee",
      select: "form-control",
      ribbon: ""
    },
    highlightColor: "#006289"
  });
````


====================================================
#### StarryNight/Nightwatch API - Provides

````js
// component API calls
reviewHipaaAuditLogPage()
hipaaLogEntryContains(rowIndex, hipaaEvent)

// actions
logHipaaEvent(hipaaEvent, timeout)
````


------------------------
### License

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
