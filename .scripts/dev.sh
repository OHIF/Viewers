#!/bin/bash
PROJECT=$1

if [ -z "$PROJECT" ]
then
  # Default
  npx lerna run dev:viewer
else
  eval "npx lerna run dev:$PROJECT"
fi

read -p 'Press [Enter] key to continue...'
