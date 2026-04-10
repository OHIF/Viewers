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
# See the License for the specific file governing permissions and
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
apt-get install -y make # native builds (bun / node-gyp)
apt-get install -y g++

#
# Following instructions at https://github.com/nodesource/distributions/blob/master/README.md#deb
#

curl -sL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Yarn via Corepack — matches package.json "packageManager" (yarn@1.22.22)
echo "Enabling Corepack and Yarn..."
corepack enable
corepack prepare yarn@1.22.22 --activate

echo "Installing Bun via npm..."
npm install -g bun

# Verify installations
echo "Installation complete!"
echo "Yarn location: $(which yarn)"
echo "Yarn version: $(yarn --version)"
echo "Bun location: $(which bun)"
echo "Bun version: $(bun --version)"

echo "Libraries Installed"
