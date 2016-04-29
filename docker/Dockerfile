FROM jodogne/orthanc-plugins

RUN apt-get update && apt-get install -y nginx curl unzip

# ENVIRONMENT VARIABLES
ENV METEOR_VERSION 1.2.1
ENV OHIF_PATH /opt/OHIF
ENV OHIF_VIEWER_PATH $OHIF_PATH/OHIFViewer

# METEOR SETUP
RUN curl -L https://install.meteor.com/ | sh

RUN cd /opt/ && \
	echo "Downgrading meteor version \"$METEOR_VERSION\" (compatibility tuning). Be patient..." && \
	meteor create downgrade --release $METEOR_VERSION > /dev/null && \
	rm -rf downgrade && \
	echo "Done."

# PROXY SETUP (solve CORS problem)
COPY ./contents/nginx.conf /etc/nginx/nginx.conf

# OHIF SETUP
RUN cd /opt/ && curl -o ohif.zip https://codeload.github.com/OHIF/Viewers/zip/master && \
	unzip ohif.zip && \
	mv Viewers-master $OHIF_PATH

COPY ./contents/dockerSettings.json /opt/

COPY ./contents/dockerEntrypoint.sh /opt/

RUN chmod a+x /opt/dockerEntrypoint.sh

WORKDIR $OHIF_VIEWER_PATH

EXPOSE 8080

EXPOSE 3000

ENTRYPOINT /opt/dockerEntrypoint.sh \
	--release $METEOR_VERSION \
	--settings /opt/dockerSettings.json --verbose
