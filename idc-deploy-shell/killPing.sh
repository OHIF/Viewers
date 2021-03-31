#!/usr/bin/env bash

PID=`ps -al | grep -i pingJob | grep -v grep | awk '{print $2}'`
kill ${PID}