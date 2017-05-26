#!/bin/bash

nginx

Orthanc /etc/orthanc &

export PACKAGE_DIRS=../Packages
export LC_ALL="C.UTF-8"

locale

meteor $@
