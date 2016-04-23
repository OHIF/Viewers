#!/bin/bash

HOST=$DICOMWEB_HOST
PORT=$DICOMWEB_PORT

if [[ -f "$1" ]]; then
	DICOM_FILE=$1

	OUTPUT=$(curl -v "http://$HOST:$PORT/instances/" -H "Origin: http://$HOST:$PORT" -H 'Accept-Encoding: gzip, deflate'-H 'Connection: keep-alive' --compressed --data-binary @"$DICOM_FILE" 2> /dev/null)

	DICOM_ID=$(echo $OUTPUT |sed -e 's/.*"id"\s*:\s*"\([a-zA-Z0-9-]\+\)".*/\1/gI')
	DICOM_PATH=$(echo $OUTPUT |sed -e 's/.*"path"\s*:\s*"\([^"]\+\)".*/\1/gI')

	if [[ -n "$DICOM_ID" ]]; then
		echo File: $DICOM_FILE
		echo Id: $DICOM_ID
		echo Path: $DICOM_PATH
		echo
	else
		echo "The image was not uploaded" >/dev/stderr
		exit 1
	fi
elif [[ -d "$1" ]]; then
	DICOM_DIR=$1

	find "$DICOM_DIR" -type f -iregex '.*\(dcm\|dicom\)' | xargs -n1 -I{} "$0" "{}"
fi

exit 0
