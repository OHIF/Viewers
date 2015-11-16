DICOMHP.select = function(hpInstance) {
  var imageSetsSequence = hpInstance["00720020"].Value;
  if (!imageSetsSequence) {
    return [];
  }
  var matchedImageSets = [];
  imageSetsSequence.forEach(function(imageSet) {
    var selectorSequence = imageSet["00720022"].Value;
    selectorSequence.forEach(function(selector){
      var usageFlag = selector["00720024"].Value[0],
          selectorAttribute = selector["00720026"].Value[0],
          selectorAttributeVR = selector["00720050"].Value[0],
          selectorAttributeValue = null;

      if (selectorAttributeVR == 'SQ') {
        return;
      } else if (selectorAttributeVR == 'AT') {
        selectorAttributeValue = selector["00720060"].Value[0];
      } else if (selectorAttributeVR == 'CS') {
        selectorAttributeValue = selector["00720062"].Value[0];
      } else if (selectorAttributeVR == 'IS') {
        selectorAttributeValue = selector["00720064"].Value[0];
      } else if (selectorAttributeVR == 'LO') {
        selectorAttributeValue = selector["00720066"].Value[0];
      } else if (selectorAttributeVR == 'LT') {
        selectorAttributeValue = selector["00720068"].Value[0];
      } else if (selectorAttributeVR == 'PN') {
        selectorAttributeValue = selector["0072006A"].Value[0];
      } else if (selectorAttributeVR == 'SH') {
        selectorAttributeValue = selector["0072006C"].Value[0];
      } else if (selectorAttributeVR == 'ST') {
        selectorAttributeValue = selector["0072006E"].Value[0];
      } else if (selectorAttributeVR == 'UT') {
        selectorAttributeValue = selector["00720070"].Value[0];
      } else if (selectorAttributeVR == 'DS') {
        selectorAttributeValue = selector["00720072"].Value[0];
      } else if (selectorAttributeVR == 'FD') {
        selectorAttributeValue = selector["00720074"].Value[0];
      } else if (selectorAttributeVR == 'FL') {
        selectorAttributeValue = selector["00720076"].Value[0];
      } else if (selectorAttributeVR == 'UL') {
        selectorAttributeValue = selector["00720078"].Value[0];
      } else if (selectorAttributeVR == 'US') {
        selectorAttributeValue = selector["0072007A"].Value[0];
      } else if (selectorAttributeVR == 'SL') {
        selectorAttributeValue = selector["0072007C"].Value[0];
      } else if (selectorAttributeVR == 'SS') {
        selectorAttributeValue = selector["0072007E"].Value[0];
      }

      if (selectorAttributeValue !== null) {

      }
    });

    var timeBasedImageSetsSequence = imageSet["00720030"].Value;
    timeBasedImageSetsSequence.forEach(function(timeImageSet){
      var setNumber = timeImageSet["00720032"].Value[0], selectorCategory = timeImageSet["00720034"].Value[0];

      var mImageSet = new DICOMHP.imageSet(setNumber, selectorCategory);
      if (selectorCategory == 'RELATIVE_TIME') {
        var relativeTime = timeImageSet["00720038"].Value[0], timeUnits = timeImageSet["0072003A"].Value[0];
        
        mImageSet.setRelativeTime(relativeTime);
        mImageSet.setTimeUnits(timeUnits);
      } else if (selectorCategory == 'ABSTRACT_PRIOR') {
        var priorValue = timeImageSet["0072003C"].Value[0];

        mImageSet.setPriorValue(priorValue);
      }

      matchedImageSets.push(mImageSet);
    });
  });

  return matchedImageSets;
};