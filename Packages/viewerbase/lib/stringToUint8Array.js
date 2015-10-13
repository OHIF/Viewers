stringToUint8Array = function(str) {
  var uint=new Uint8Array(str.length);
  for(var i=0,j=str.length;i<j;i++){
    uint[i]=str.charCodeAt(i);
  }
  return uint;
};
