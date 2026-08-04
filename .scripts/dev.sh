#!/bin/bash
# https://github.com/shelljs/shelljs
# https://github.com/shelljs/shelljs#exclude-options
PROJECT=$1

if [ -z "$PROJECT" ]
then
  # Default
  pnpm --filter @ohif/app run dev:viewer
else
  pnpm --filter @ohif/app run "dev:$PROJECT"
fi

read -p 'Press [Enter] key to continue...'
