---
sidebar_position: 3
sidebar_label: Environment Variables
---
# Environment Variables

There are a number of environment variables we use at build time to influence the output application's behavior.

```bash
# Application
NODE_ENV=< production | development >
DEBUG=< true | false >
APP_CONFIG=< relative path to application configuration file >
PUBLIC_URL=<>
VERSION_NUMBER=<Set by CircleCI>
BUILD_NUM=<Set by CircleCI>
# i18n
USE_LOCIZE=<false>
LOCIZE_PROJECTID=<ProjectID to pull translations for>
LOCIZE_API_KEY=<To enable Locize live editing of translations>
```

## Setting Environment Variables

- `npx cross-env`
- `.env` files
- env variables on build machine, or for terminal session
