local pipelineCommon = {
  kind: 'pipeline',
  type: 'docker',
};


local jsStepCommon = {
  image: 'node:16',
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

local deployV3 = pipelineCommon {
  name: 'deploy-v3',
  trigger: {
    branch: [
      'feat/nl-v3-stable',
    ],
    event: [
      'push',
    ],
  },
  clone: {
    disable: true,
  },
  steps: [
    jsStepCommon {
      name: 'deploy-v3',
      environment: {
        NPM_AUTH_TOKEN: {
          from_secret: 'NPM_AUTH_TOKEN',
        },
      },
      commands: [
        'git clone -b feat/nl-v3-stable --single-branch https://github.com/new-lantern/nl-ohif',
        'cd nl-ohif',
        'git clone -b v3-stable --single-branch https://github.com/new-lantern/nl-ohif-modules',
        'git clone -b v3-stable --single-branch https://github.com/new-lantern/nl-pacs',
        'apt-get -y update',
        'apt-get -y install jq',
        'yarn',
        'cd nl-ohif-modules/viewer',
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

local deployProduction = pipelineCommon {
  name: 'deploy-production',
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
        'apt-get -y update',
        'apt-get-y install jq',
        'cd platform/viewer',
        'yarn',
        'rm dist -r',
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
  deployV3,
  deployProduction,
]
