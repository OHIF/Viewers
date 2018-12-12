#!/bin/bash

declare config='../config/orthancDICOMWeb.json'

if [ $# -gt 0 ]; then
    if [ "$1" = '--dimse' ]; then
        config="${config%/*}/orthancDIMSE.json"
        [ -f "$config" ] && echo "DIMSE config file selected: $config"
    fi
fi

echo 'Starting Meteor server...'
METEOR_PACKAGE_DIRS="../Packages" meteor --settings "$config"
