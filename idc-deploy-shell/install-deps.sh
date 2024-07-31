#!/usr/bin/env bash

# Copyright 2020, Institute for Systems Biology
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Note that CIRCLE_PROJECT_REPONAME is a Circle CI built-in var:
export HOME=/home/circleci/${CIRCLE_PROJECT_REPONAME}
export HOMEROOT=/home/circleci/${CIRCLE_PROJECT_REPONAME}

# Install and update apt-get info
echo "Preparing System..."
apt-get -y install software-properties-common
apt-get update -qq
apt-get upgrade -y

apt-get install -y	git
apt-get install -y make # needed by yarn install...
apt-get install -y g++ # needed by yarn install...

#
# Following instructions at https://classic.yarnpkg.com/ and
# https://github.com/nodesource/distributions/blob/master/README.md#deb
#

curl -sL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt-get install -y yarn

# See https://github.com/yarnpkg/yarn/issues/3708:
apt-get remove cmdinstall
apt update
apt-get install -y yarn

yarn config set workspaces-experimental true

echo "Libraries Installed"
