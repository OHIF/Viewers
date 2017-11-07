@echo off

set METEOR_SETTINGS=
type orthancDICOMWeb.json > METEOR_SETTINGS

set MONGO_URL=mongodb://localhost:27017/lesiontracker
set ROOT_URL=http://localhost
set PORT=3000

node bundle\main.js