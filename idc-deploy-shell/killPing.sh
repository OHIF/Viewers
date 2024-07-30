#!/usr/bin/env bash

PJPID=`ps -al | grep -i pingJob | grep -v grep | awk '{print $2}'`
if [ -n "${PJPID}" ]; then
    kill ${PJPID}
fi
