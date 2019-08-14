#!/bin/bash
# https://github.com/shelljs/shelljs
# https://github.com/shelljs/shelljs#exclude-options
PROJECT=$1

if [ -z "$PROJECT" ]
then
  # Default
  npx lerna run dev:viewer
else
  eval "npx lerna run dev:$PROJECT"
fi

read -p 'Press [Enter] key to continue...'
