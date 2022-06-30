#!/bin/sh

VERSION=$(npm view @newlantern/viewer version)

if [ -z "$NAME" ]
then
  NAME="@newlantern/viewer"
fi

if [ -z "$ENTRY" ]
then
  ENTRY="index.umd.js"
fi

if [ -z "$REPO" ]
then
  REPO="https://github.com/new-lantern/nl-ohif"
fi

cd dist
echo "{" >> package.json
echo "  \"name\": \"$NAME\"," >> package.json
echo "  \"version\": \"$VERSION\"," >> package.json
echo "  \"main\": \"$ENTRY\"," >> package.json
echo "  \"repository\": \"$REPO\"," >> package.json
echo "  \"license\": \"MIT\"" >> package.json
echo "}" >> package.json
