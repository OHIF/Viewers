function findBoundary(header) {
  for(var i=0; i < header.length; i++) {
    if(header[i].substr(0,2) === '--') {
      return header[i];
    }
  }
  return undefined;
}

function findContentType(header) {
  for(var i=0; i < header.length; i++) {
    if(header[i].substr(0,13) === 'Content-Type:') {
      return header[i].substr(13).trim();
    }
  }
  return undefined;
}

DICOMWeb.getImageFrame = function(uri, mediaType) {
  mediaType = mediaType || 'application/octet-stream';

  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.open("get", uri, true);
    xhr.setRequestHeader('Accept', 'multipart/related;type=' + mediaType);
    xhr.onreadystatechange = function (oEvent) {
      // TODO: consider sending out progress messages here as we receive the pixel data
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // request succeeded, Parse the multi-part mime response
          var imageFrameAsArrayBuffer = xhr.response;
          var response = new Uint8Array(xhr.response);
          // First look for the multipart mime header
          var tokenIndex = findIndexOfString(response, '\n\r\n');
          if(tokenIndex === -1) {
            reject('invalid response - no multipart mime header');
          }
          var header = uint8ArrayToString(response, 0, tokenIndex);
          // Now find the boundary  marker
          var split = header.split('\r\n');
          var boundary = findBoundary(split);
          if(!boundary) {
            reject('invalid response - no boundary marker');
          }
          var offset = tokenIndex + 4; // skip over the \n\r\n

          // find the terminal boundary marker
          var endIndex = findIndexOfString(response, boundary, offset);
          if(endIndex === -1) {
            reject('invalid response - terminating boundary not found');
          }
          // return the info for this pixel data
          var length = endIndex - offset - 1;
          resolve({
            contentType: findContentType(split),
            arrayBuffer: imageFrameAsArrayBuffer,
            offset: offset,
            length: length
          });
        }
        else {
          // request failed, reject the deferred
          reject(xhr.response);
        }
      }
    };
    xhr.send();
  });
};