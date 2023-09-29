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


cat idc-assets/app-config-template.js | \
    sed "s#_X___IDC__Z__ROOT___Y_#${STORE_ROOT}#" | \
    sed "s#_X___IDC__Z__QUOTA___Y_#${QUOTA_PAGE}#" | \
    sed "s#_X___IDC__LOGO__LINK___Y_#${LOGO_LINK}#"



