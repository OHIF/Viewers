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
      from_secret: 'DEPLOYMENT_WEBHOOK',
    },
    icon_url: 'https://iconape.com/wp-content/png_logo_vector/drone.png',
    channel: 'deployments',
    username: 'Drone',
    template: |||
      {{#success build.status}}
        {{ build.author }} has deployed {{ repo.name }} to NPM
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
      'feat/nl-dev',
    ],
    event: [
      'push',
    ],
  },
  steps: [
    jsStepCommon {
      name: 'deploy-production',
      environment: {
        NPM_AUTH_TOKEN: {
          from_secret: 'NPM_AUTH_TOKEN',
        },
      },
      commands: [
        'cd platform/viewer',
        'yarn',
        'yarn prepare',
        'sh package_gen.sh',
        'cd dist',
        'npm version patch',
        'echo "//registry.npmjs.org/:_authToken=$NPM_AUTH_TOKEN" > ~/.npmrc',
        'yarn publish',
      ],
    },
    slackDeployMessage,
  ],
};



[
  deployProduction,
]
