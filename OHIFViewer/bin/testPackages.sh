#!/bin/bash

##################################################
# Runs the packages tests
##################################################

# check execution arguments
while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    case $PARAM in
        -c | --coverage)
            export RUN_COVERAGE=1
            ;;
        -v | --verbose)
            export COVERAGE_VERBOSE=1
            ;;
        -s | --spacejam)
            export RUN_SPACEJAM=1
            ;;
        *)
    esac
    shift
done

if [ "$RUN_COVERAGE" == 1 ];
then
    # Setting coverage variables
    app_folder=$(pwd)
    app_folder+="/packages/ohif-viewerbase/"
    export COVERAGE_APP_FOLDER=$app_folder
    export COVERAGE=1
    echo 'Running meteor-coverage'
fi

if [ "$RUN_SPACEJAM" == 1 ];
then
    spacejam-mocha ./packages/ohif-viewerbase/
else
    meteor test-packages --driver-package='cultofcoders:mocha' ./packages/ohif-viewerbase/
fi
