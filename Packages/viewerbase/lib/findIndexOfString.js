function checkToken(token, data, dataOffset) {

  if(dataOffset + token.length > data.length) {
    //console.log('dataOffset >> ', dataOffset);
    return false;
  }

  var endIndex = dataOffset;

  for(var i = 0; i < token.length; i++) {
    if(token[i] !== data[endIndex++]) {
      if(endIndex > 520000) {
        console.log('token=',uint8ArrayToString(token));
        console.log('data=', uint8ArrayToString(data, dataOffset, endIndex-dataOffset));
        console.log('miss at %d %s dataOffset=%d', i, String.fromCharCode(data[endIndex]), endIndex);
        console.log('miss at %d %s dataOffset=%d', i, String.fromCharCode(token[endIndex]), endIndex);
      }
      return false;
    }
  }
  return true;
}

findIndexOfString = function(data, str, offset) {

  offset = offset || 0;

  var token = stringToUint8Array(str);

  for(var i=offset; i < data.length; i++) {
    if(token[0] === data[i]) {
      //console.log('match @', i);
      if(checkToken(token, data, i)) {
        return i;
      }
    }
  }
  return -1;
}