local pipelineCommon = {
  kind: 'pipeline',
  type: 'docker',
};


local jsStepCommon = {
  image: 'node:14',
};

local slackDeployMessage = {
  name: 'slack',
  image: 'plugins/slack',
  settings: {
    webhook: {
      from_secret: 'TEST_WEBHOOK',
    },
    icon_url: 'https://iconape.com/wp-content/png_logo_vector/drone.png',
    channel: 'ci-cd-test',
    username: 'Drone',
    template: |||
      {{#success build.status}}
        {{ build.author }} has deployed {{ repo.name }} to {{ build.deployTo }}
        https://github.com/{{ repo.owner }}/{{ repo.name }}/commit/{{ build.commit }}
      {{else}}
        {{ repo.name }} failed to deploy.
        {{ build.link }}
      {{/success}}
    |||,
  },
};



local deployProduction = pipelineCommon {
  trigger: {
    branch: [
      'feat/ci-cd',
    ],
    event: [
      'push',
    ],
  },
  steps: [
    jsStepCommon {
      name: 'deploy-production',
      environment: {
        NAME: '@newlantern/viewer',
        ENTRY: 'index.umd.js',
        REPO: 'https://github.com/new-lantern/nl-ohif',
      },
      commands: [
        'cd platform/viewer',
        'yarn',
        'yarn prepare',
        'cd dist',
        'VERSION=$(npm view @newlantern/viewer version)',
        'echo "{" >> package.json',
        'echo "  \"name\": \"$NAME\"," >> package.json',
        'echo "  \"version\": \"$VERSION\"," >> package.json',
        'echo "  \"main\": \"$ENTRY\"," >> package.json',
        'echo "  \"repository\": \"$REPO\"," >> package.json',
        'echo "  \"license\": \"MIT\"," >> package.json',
        'echo "}" >> package.json',
        'cat package.json',
        'echo "$VERSION"',
      ],
    },
    slackDeployMessage,
  ],
};


[
  deployProduction,
]
