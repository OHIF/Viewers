/*! dicom-parser - v1.1.5 - 2015-08-17 | (c) 2014 Chris Hafey | https://github.com/chafey/dicomParser */
(function (root, factory) {

  // node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  }
  else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals
    if(typeof cornerstone === 'undefined'){
      dicomParser = {};

      // meteor
      if (typeof Package !== 'undefined') {
        root.dicomParser = dicomParser;
      }
    }
    dicomParser = factory();
  }
}(this, function () {

  /**
   * Parses a DICOM P10 byte array and returns a DataSet object with the parsed elements.  If the options
   * argument is supplied and it contains the untilTag property, parsing will stop once that
   * tag is encoutered.  This can be used to parse partial byte streams.
   *
   * @param byteArray the byte array
   * @param options object to control parsing behavior (optional)
   * @returns {DataSet}
   * @throws error if an error occurs while parsing.  The exception object will contain a property dataSet with the
   *         elements successfully parsed before the error.
   */
  var dicomParser = (function(dicomParser) {
    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    dicomParser.parseDicom = function(byteArray, options) {

      if(byteArray === undefined)
      {
        throw "dicomParser.parseDicom: missing required parameter 'byteArray'";
      }

      var littleEndianByteStream = new dicomParser.ByteStream(dicomParser.littleEndianByteArrayParser, byteArray);

      function readPrefix()
      {
        littleEndianByteStream.seek(128);
        var prefix = littleEndianByteStream.readFixedString(4);
        if(prefix !== "DICM")
        {
          throw "dicomParser.parseDicom: DICM prefix not found at location 132";
        }
      }

      function readPart10Header()
      {
        // Per the DICOM standard, the header is always encoded in Explicit VR Little Endian (see PS3.10, section 7.1)
        // so use littleEndianByteStream throughout this method regardless of the transfer syntax
        readPrefix();

        var warnings = [];
        var elements = {};
        while(littleEndianByteStream.position < littleEndianByteStream.byteArray.length) {
          var position = littleEndianByteStream.position;
          var element = dicomParser.readDicomElementExplicit(littleEndianByteStream, warnings);
          if(element.tag > 'x0002ffff') {
            littleEndianByteStream.position = position;
            break;
          }
          // Cache the littleEndianByteArrayParser for meta header elements, since the rest of the data set may be big endian
          // and this parser will be needed later if the meta header values are to be read.
          element.parser = dicomParser.littleEndianByteArrayParser;
          elements[element.tag] = element;
        }
        var metaHeaderDataSet = new dicomParser.DataSet(littleEndianByteStream.byteArrayParser, littleEndianByteStream.byteArray, elements);
        metaHeaderDataSet.warnings = littleEndianByteStream.warnings;
        return metaHeaderDataSet;
      }

      function readTransferSyntax(metaHeaderDataSet) {
        if(metaHeaderDataSet.elements.x00020010 === undefined) {
          throw 'dicomParser.parseDicom: missing required meta header attribute 0002,0010';
        }
        var transferSyntaxElement = metaHeaderDataSet.elements.x00020010;
        return dicomParser.readFixedString(littleEndianByteStream.byteArray, transferSyntaxElement.dataOffset, transferSyntaxElement.length);
      }

      function isExplicit(transferSyntax) {
        if(transferSyntax === '1.2.840.10008.1.2') // implicit little endian
        {
          return false;
        }
        // all other transfer syntaxes should be explicit
        return true;
      }

      function getDataSetByteStream(transferSyntax) {
        if(transferSyntax === '1.2.840.10008.1.2.2') // explicit big endian
        {
          return new dicomParser.ByteStream(dicomParser.bigEndianByteArrayParser, byteArray, littleEndianByteStream.position);
        }
        else
        {
          // all other transfer syntaxes are little endian; only the pixel encoding differs
          // make a new stream so the metaheader warnings don't come along for the ride
          return new dicomParser.ByteStream(dicomParser.littleEndianByteArrayParser, byteArray, littleEndianByteStream.position);
        }
      }

      function mergeDataSets(metaHeaderDataSet, instanceDataSet)
      {
        for (var propertyName in metaHeaderDataSet.elements)
        {
          if(metaHeaderDataSet.elements.hasOwnProperty(propertyName))
          {
            instanceDataSet.elements[propertyName] = metaHeaderDataSet.elements[propertyName];
          }
        }
        if (metaHeaderDataSet.warnings !== undefined) {
          instanceDataSet.warnings = metaHeaderDataSet.warnings.concat(instanceDataSet.warnings);
        }
        return instanceDataSet;
      }

      function readDataSet(metaHeaderDataSet)
      {
        var transferSyntax = readTransferSyntax(metaHeaderDataSet);
        var explicit = isExplicit(transferSyntax);
        var dataSetByteStream = getDataSetByteStream(transferSyntax);

        var elements = {};
        var dataSet = new dicomParser.DataSet(dataSetByteStream.byteArrayParser, dataSetByteStream.byteArray, elements);
        dataSet.warnings = dataSetByteStream.warnings;

        try{
          if(explicit) {
            dicomParser.parseDicomDataSetExplicit(dataSet, dataSetByteStream, dataSetByteStream.byteArray.length, options);
          }
          else
          {
            dicomParser.parseDicomDataSetImplicit(dataSet, dataSetByteStream, dataSetByteStream.byteArray.length, options);
          }
        }
        catch(e) {
          var ex = {
            exception: e,
            dataSet: dataSet
          };
          throw ex;
        }
        return dataSet;
      }

      // main function here
      function parseTheByteStream() {
        var metaHeaderDataSet = readPart10Header();

        var dataSet = readDataSet(metaHeaderDataSet);

        return mergeDataSets(metaHeaderDataSet, dataSet);
      }

      // This is where we actually start parsing
      return parseTheByteStream();
    };

    return dicomParser;
  })(dicomParser);

  var dicomParser = (function (dicomParser) {
    "use strict";

    if (dicomParser === undefined) {
      dicomParser = {};
    }

    /**
     * converts an explicit dataSet to a javascript object
     * @param dataSet
     * @param options
     */
    dicomParser.explicitDataSetToJS = function (dataSet, options) {

      if(dataSet === undefined) {
        throw 'dicomParser.explicitDataSetToJS: missing required parameter dataSet';
      }

      options = options || {
        omitPrivateAttibutes: true, // true if private elements should be omitted
        maxElementLength : 128      // maximum element length to try and convert to string format
      };

      var result = {

      };

      for(var tag in dataSet.elements) {
        var element = dataSet.elements[tag];

        // skip this element if it a private element and our options specify that we should
        if(options.omitPrivateAttibutes === true && dicomParser.isPrivateTag(tag))
        {
          continue;
        }

        if(element.items) {
          // handle sequences
          var sequenceItems = [];
          for(var i=0; i < element.items.length; i++) {
            sequenceItems.push(dicomParser.explicitDataSetToJS(element.items[i].dataSet, options));
          }
          result[tag] = sequenceItems;
        } else {
          var asString;
          asString = undefined;
          if(element.length < options.maxElementLength) {
            asString = dicomParser.explicitElementToString(dataSet, element);
          }

          if(asString !== undefined) {
            result[tag] = asString;
          }  else {
            result[tag] = {
              dataOffset: element.dataOffset,
              length : element.length
            };
          }
        }
      }

      return result;
    };


    return dicomParser;
  }(dicomParser));
  var dicomParser = (function (dicomParser) {
    "use strict";

    if (dicomParser === undefined) {
      dicomParser = {};
    }

    /**
     * Converts an explicit VR element to a string or undefined if it is not possible to convert.
     * Throws an error if an implicit element is supplied
     * @param dataSet
     * @param element
     * @returns {*}
     */
    dicomParser.explicitElementToString = function(dataSet, element)
    {
      if(dataSet === undefined || element === undefined) {
        throw 'dicomParser.explicitElementToString: missing required parameters';
      }
      if(element.vr === undefined) {
        throw 'dicomParser.explicitElementToString: cannot convert implicit element to string';
      }
      var vr = element.vr;
      var tag = element.tag;

      var textResult;

      function multiElementToString(numItems, func) {
        var result = "";
        for(var i=0; i < numItems; i++) {
          if(i !== 0) {
            result += '/';
          }
          result += func.call(dataSet, tag).toString();
        }
        return result;
      }

      if(dicomParser.isStringVr(vr) === true)
      {
        textResult = dataSet.string(tag);
      }
      else if (vr == 'AT') {
        var num = dataSet.uint32(tag);
        if(num === undefined) {
          return undefined;
        }
        if (num < 0)
        {
          num = 0xFFFFFFFF + num + 1;
        }

        return 'x' + num.toString(16).toUpperCase();
      }
      else if (vr == 'US')
      {
        textResult = multiElementToString(element.length / 2, dataSet.uint16);
      }
      else if(vr === 'SS')
      {
        textResult = multiElementToString(element.length / 2, dataSet.int16);
      }
      else if (vr == 'UL')
      {
        textResult = multiElementToString(element.length / 4, dataSet.uint32);
      }
      else if(vr === 'SL')
      {
        textResult = multiElementToString(element.length / 4, dataSet.int32);
      }
      else if(vr == 'FD')
      {
        textResult = multiElementToString(element.length / 8, dataSet.double);
      }
      else if(vr == 'FL')
      {
        textResult = multiElementToString(element.length / 4, dataSet.float);
      }

      return textResult;
    };
    return dicomParser;
  }(dicomParser));
  /**
   * Utility functions for dealing with DICOM
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    // algorithm based on http://stackoverflow.com/questions/1433030/validate-number-of-days-in-a-given-month
    function daysInMonth(m, y) { // m is 0 indexed: 0-11
      switch (m) {
        case 2 :
          return (y % 4 == 0 && y % 100) || y % 400 == 0 ? 29 : 28;
        case 9 : case 4 : case 6 : case 11 :
        return 30;
        default :
          return 31
      }
    }

    function isValidDate(d, m, y) {
      // make year is a number
      if(isNaN(y)) {
        return false;
      }
      return m > 0 && m <= 12 && d > 0 && d <= daysInMonth(m, y);
    }


    /**
     * Parses a DA formatted string into a Javascript object
     * @param {string} date a string in the DA VR format
     * @param {boolean} [validate] - true if an exception should be thrown if the date is invalid
     * @returns {*} Javascript object with properties year, month and day or undefined if not present or not 8 bytes long
     */
    dicomParser.parseDA = function(date, validate)
    {
      if(date && date.length === 8)
      {
        var yyyy = parseInt(date.substring(0, 4), 10);
        var mm = parseInt(date.substring(4, 6), 10);
        var dd = parseInt(date.substring(6, 8), 10);

        if(validate) {
          if (isValidDate(dd, mm, yyyy) !== true) {
            throw "invalid DA '" + date + "'";
          }
        }
        return {
          year: yyyy,
          month: mm,
          day: dd
        };
      }
      if(validate) {
        throw "invalid DA '" + date + "'";
      }
      return undefined;
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Utility functions for dealing with DICOM
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * Parses a TM formatted string into a javascript object with properties for hours, minutes, seconds and fractionalSeconds
     * @param {string} time - a string in the TM VR format
     * @param {boolean} [validate] - true if an exception should be thrown if the date is invalid
     * @returns {*} javascript object with properties for hours, minutes, seconds and fractionalSeconds or undefined if no element or data.  Missing fields are set to undefined
     */
    dicomParser.parseTM = function(time, validate) {

      if (time.length >= 2) // must at least have HH
      {
        // 0123456789
        // HHMMSS.FFFFFF
        var hh = parseInt(time.substring(0, 2), 10);
        var mm = time.length >= 4 ? parseInt(time.substring(2, 4), 10) : undefined;
        var ss = time.length >= 6 ? parseInt(time.substring(4, 6), 10) : undefined;
        var ffffff = time.length >= 8 ? parseInt(time.substring(7, 13), 10) : undefined;

        if(validate) {
          if((isNaN(hh)) ||
            (mm !== undefined && isNaN(mm)) ||
            (ss !== undefined && isNaN(ss)) ||
            (ffffff !== undefined && isNaN(ffffff)) ||
            (hh < 0 || hh > 23) ||
            (mm && (mm <0 || mm > 59))  ||
            (ss && (ss <0 || ss > 59))  ||
            (ffffff && (ffffff <0 || ffffff > 999999)))
          {
            throw "invalid TM '" + time + "'";
          }
        }

        return {
          hours: hh,
          minutes: mm,
          seconds: ss,
          fractionalSeconds: ffffff
        };
      }

      if(validate) {
        throw "invalid TM '" + time + "'";
      }

      return undefined;
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Utility functions for dealing with DICOM
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    var stringVrs = {
      AE: true,
      AS: true,
      AT: false,
      CS: true,
      DA: true,
      DS: true,
      DT: true,
      FL: false,
      FD: false,
      IS: true,
      LO: true,
      LT: true,
      OB: false,
      OD: false,
      OF: false,
      OW: false,
      PN: true,
      SH: true,
      SL: false,
      SQ: false,
      SS: false,
      ST: true,
      TM: true,
      UI: true,
      UL: false,
      UN: undefined, // dunno
      UR: true,
      US: false,
      UT: true
    };

    /**
     * Tests to see if vr is a string or not.
     * @param vr
     * @returns true if string, false it not string, undefined if unknown vr or UN type
     */
    dicomParser.isStringVr = function(vr)
    {
      return stringVrs[vr];
    };

    /**
     * Tests to see if a given tag in the format xggggeeee is a private tag or not
     * @param tag
     * @returns {boolean}
     */
    dicomParser.isPrivateTag = function(tag)
    {
      var lastGroupDigit = parseInt(tag[4]);
      var groupIsOdd = (lastGroupDigit % 2) === 1;
      return groupIsOdd;
    };

    /**
     * Parses a PN formatted string into a javascript object with properties for givenName, familyName, middleName, prefix and suffix
     * @param personName a string in the PN VR format
     * @param index
     * @returns {*} javascript object with properties for givenName, familyName, middleName, prefix and suffix or undefined if no element or data
     */
    dicomParser.parsePN = function(personName) {
      if(personName === undefined) {
        return undefined;
      }
      var stringValues = personName.split('^');
      return {
        familyName: stringValues[0],
        givenName: stringValues[1],
        middleName: stringValues[2],
        prefix: stringValues[3],
        suffix: stringValues[4]
      };
    };



    return dicomParser;
  }(dicomParser));
  /**
   * Functionality for extracting encapsulated pixel data
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    function getPixelDataFromFragments(byteStream, fragments, bufferSize)
    {
      // if there is only one fragment, return a view on this array to avoid copying
      if(fragments.length === 1) {
        return new Uint8Array(byteStream.byteArray.buffer, fragments[0].dataOffset, fragments[0].length);
      }

      // more than one fragment, combine all of the fragments into one buffer
      var pixelData = new Uint8Array(bufferSize);
      var pixelDataIndex = 0;
      for(var i=0; i < fragments.length; i++) {
        var fragmentOffset = fragments[i].dataOffset;
        for(var j=0; j < fragments[i].length; j++) {
          pixelData[pixelDataIndex++] = byteStream.byteArray[fragmentOffset++];
        }
      }

      return pixelData;
    }

    function readFragmentsUntil(byteStream, endOfFrame) {
      // Read fragments until we reach endOfFrame
      var fragments = [];
      var bufferSize = 0;
      while(byteStream.position < endOfFrame && byteStream.position < byteStream.byteArray.length) {
        var fragment = dicomParser.readSequenceItem(byteStream);
        // NOTE: we only encounter this for the sequence delimiter tag when extracting the last frame
        if(fragment.tag === 'xfffee0dd') {
          break;
        }
        fragments.push(fragment);
        byteStream.seek(fragment.length);
        bufferSize += fragment.length;
      }

      // Convert the fragments into a single pixelData buffer
      var pixelData = getPixelDataFromFragments(byteStream, fragments, bufferSize);
      return pixelData;
    }

    function readEncapsulatedPixelDataWithBasicOffsetTable(pixelDataElement, byteStream, frame) {
      //  validate that we have an offset for this frame
      var numFrames = pixelDataElement.basicOffsetTable.length;
      if(frame > numFrames) {
        throw "dicomParser.readEncapsulatedPixelData: parameter frame exceeds number of frames in basic offset table";
      }

      // move to the start of this frame
      var frameOffset = pixelDataElement.basicOffsetTable[frame];
      byteStream.seek(frameOffset);

      // Find the end of this frame
      var endOfFrameOffset = pixelDataElement.basicOffsetTable[frame + 1];
      if(endOfFrameOffset === undefined) { // special case for last frame
        endOfFrameOffset = byteStream.position + pixelDataElement.length;
      }

      // read this frame
      var pixelData = readFragmentsUntil(byteStream, endOfFrameOffset);
      return pixelData;
    }

    function readEncapsulatedDataNoBasicOffsetTable(pixelDataElement, byteStream, frame) {
      // if the basic offset table is empty, this is a single frame so make sure the requested
      // frame is 0
      if(frame !== 0) {
        throw 'dicomParser.readEncapsulatedPixelData: non zero frame specified for single frame encapsulated pixel data';
      }

      // read this frame
      var endOfFrame = byteStream.position + pixelDataElement.length;
      var pixelData = readFragmentsUntil(byteStream, endOfFrame);
      return pixelData;
    }

    /**
     * Returns the pixel data for the specified frame in an encapsulated pixel data element
     *
     * @param dataSet - the dataSet containing the encapsulated pixel data
     * @param pixelDataElement - the pixel data element (x7fe00010) to extract the frame from
     * @param frame - the zero based frame index
     * @returns Uint8Array with the encapsulated pixel data
     */
    dicomParser.readEncapsulatedPixelData = function(dataSet, pixelDataElement, frame)
    {
      if(dataSet === undefined) {
        throw "dicomParser.readEncapsulatedPixelData: missing required parameter 'dataSet'";
      }
      if(pixelDataElement === undefined) {
        throw "dicomParser.readEncapsulatedPixelData: missing required parameter 'element'";
      }
      if(frame === undefined) {
        throw "dicomParser.readEncapsulatedPixelData: missing required parameter 'frame'";
      }
      if(pixelDataElement.tag !== 'x7fe00010') {
        throw "dicomParser.readEncapsulatedPixelData: parameter 'element' refers to non pixel data tag (expected tag = x7fe00010'";
      }
      if(pixelDataElement.encapsulatedPixelData !== true) {
        throw "dicomParser.readEncapsulatedPixelData: parameter 'element' refers to pixel data element that does not have encapsulated pixel data";
      }
      if(pixelDataElement.hadUndefinedLength !== true) {
        throw "dicomParser.readEncapsulatedPixelData: parameter 'element' refers to pixel data element that does not have encapsulated pixel data";
      }
      if(pixelDataElement.basicOffsetTable === undefined) {
        throw "dicomParser.readEncapsulatedPixelData: parameter 'element' refers to pixel data element that does not have encapsulated pixel data";
      }
      if(pixelDataElement.fragments === undefined) {
        throw "dicomParser.readEncapsulatedPixelData: parameter 'element' refers to pixel data element that does not have encapsulated pixel data";
      }
      if(frame < 0) {
        throw "dicomParser.readEncapsulatedPixelData: parameter 'frame' must be >= 0";
      }

      // seek past the basic offset table (no need to parse it again since we already have)
      var byteStream = new dicomParser.ByteStream(dataSet.byteArrayParser, dataSet.byteArray, pixelDataElement.dataOffset);
      var basicOffsetTable = dicomParser.readSequenceItem(byteStream);
      if(basicOffsetTable.tag !== 'xfffee000')
      {
        throw "dicomParser.readEncapsulatedPixelData: missing basic offset table xfffee000";
      }
      byteStream.seek(basicOffsetTable.length);

      // If the basic offset table is empty (no entries), it is a single frame.  If it is not empty,
      // it has at least one frame so use the basic offset table to find the bytes
      if(pixelDataElement.basicOffsetTable.length !== 0)
      {
        return readEncapsulatedPixelDataWithBasicOffsetTable(pixelDataElement, byteStream, frame);
      }
      else
      {
        return readEncapsulatedDataNoBasicOffsetTable(pixelDataElement, byteStream, frame);
      }
    };

    return dicomParser;
  }(dicomParser));

  /**
   * Internal helper functions for parsing different types from a big-endian byte array
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    dicomParser.bigEndianByteArrayParser = {
      /**
       *
       * Parses an unsigned int 16 from a big-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed unsigned int 16
       * @throws error if buffer overread would occur
       * @access private
       */
      readUint16: function (byteArray, position) {
        if (position < 0) {
          throw 'bigEndianByteArrayParser.readUint16: position cannot be less than 0';
        }
        if (position + 2 > byteArray.length) {
          throw 'bigEndianByteArrayParser.readUint16: attempt to read past end of buffer';
        }
        return (byteArray[position] << 8) + byteArray[position + 1];
      },

      /**
       *
       * Parses a signed int 16 from a big-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed signed int 16
       * @throws error if buffer overread would occur
       * @access private
       */
      readInt16: function (byteArray, position) {
        if (position < 0) {
          throw 'bigEndianByteArrayParser.readInt16: position cannot be less than 0';
        }
        if (position + 2 > byteArray.length) {
          throw 'bigEndianByteArrayParser.readInt16: attempt to read past end of buffer';
        }
        var int16 = (byteArray[position] << 8) + byteArray[position + 1];
        // fix sign
        if (int16 & 0x8000) {
          int16 = int16 - 0xFFFF - 1;
        }
        return int16;
      },

      /**
       * Parses an unsigned int 32 from a big-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed unsigned int 32
       * @throws error if buffer overread would occur
       * @access private
       */
      readUint32: function (byteArray, position) {
        if (position < 0) {
          throw 'bigEndianByteArrayParser.readUint32: position cannot be less than 0';
        }

        if (position + 4 > byteArray.length) {
          throw 'bigEndianByteArrayParser.readUint32: attempt to read past end of buffer';
        }

        var uint32 = (256 * (256 * (256 * byteArray[position] +
        byteArray[position + 1]) +
        byteArray[position + 2]) +
        byteArray[position + 3]);

        return uint32;
      },

      /**
       * Parses a signed int 32 from a big-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed signed int 32
       * @throws error if buffer overread would occur
       * @access private
       */
      readInt32: function (byteArray, position) {
        if (position < 0) {
          throw 'bigEndianByteArrayParser.readInt32: position cannot be less than 0';
        }

        if (position + 4 > byteArray.length) {
          throw 'bigEndianByteArrayParser.readInt32: attempt to read past end of buffer';
        }

        var int32 = ((byteArray[position] << 24) +
        (byteArray[position + 1] << 16) +
        (byteArray[position + 2] << 8) +
        byteArray[position + 3]);

        return int32;
      },

      /**
       * Parses 32-bit float from a big-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed 32-bit float
       * @throws error if buffer overread would occur
       * @access private
       */
      readFloat: function (byteArray, position) {
        if (position < 0) {
          throw 'bigEndianByteArrayParser.readFloat: position cannot be less than 0';
        }

        if (position + 4 > byteArray.length) {
          throw 'bigEndianByteArrayParser.readFloat: attempt to read past end of buffer';
        }

        // I am sure there is a better way than this but this should be safe
        var byteArrayForParsingFloat = new Uint8Array(4);
        byteArrayForParsingFloat[3] = byteArray[position];
        byteArrayForParsingFloat[2] = byteArray[position + 1];
        byteArrayForParsingFloat[1] = byteArray[position + 2];
        byteArrayForParsingFloat[0] = byteArray[position + 3];
        var floatArray = new Float32Array(byteArrayForParsingFloat.buffer);
        return floatArray[0];
      },

      /**
       * Parses 64-bit float from a big-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed 64-bit float
       * @throws error if buffer overread would occur
       * @access private
       */
      readDouble: function (byteArray, position) {
        if (position < 0) {
          throw 'bigEndianByteArrayParser.readDouble: position cannot be less than 0';
        }

        if (position + 8 > byteArray.length) {
          throw 'bigEndianByteArrayParser.readDouble: attempt to read past end of buffer';
        }

        // I am sure there is a better way than this but this should be safe
        var byteArrayForParsingFloat = new Uint8Array(8);
        byteArrayForParsingFloat[7] = byteArray[position];
        byteArrayForParsingFloat[6] = byteArray[position + 1];
        byteArrayForParsingFloat[5] = byteArray[position + 2];
        byteArrayForParsingFloat[4] = byteArray[position + 3];
        byteArrayForParsingFloat[3] = byteArray[position + 4];
        byteArrayForParsingFloat[2] = byteArray[position + 5];
        byteArrayForParsingFloat[1] = byteArray[position + 6];
        byteArrayForParsingFloat[0] = byteArray[position + 7];
        var floatArray = new Float64Array(byteArrayForParsingFloat.buffer);
        return floatArray[0];
      }
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions common to parsing byte arrays of any type
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * Reads a string of 8-bit characters from an array of bytes and advances
     * the position by length bytes.  A null terminator will end the string
     * but will not effect advancement of the position.  Trailing and leading
     * spaces are preserved (not trimmed)
     * @param byteArray the byteArray to read from
     * @param position the position in the byte array to read from
     * @param length the maximum number of bytes to parse
     * @returns {string} the parsed string
     * @throws error if buffer overread would occur
     * @access private
     */
    dicomParser.readFixedString = function(byteArray, position, length)
    {
      if(length < 0)
      {
        throw 'readFixedString - length cannot be less than 0';
      }

      if(position + length > byteArray.length) {
        throw 'dicomParser.readFixedString: attempt to read past end of buffer';
      }

      var result = "";
      for(var i=0; i < length; i++)
      {
        var byte = byteArray[position + i];
        if(byte === 0) {
          position +=  length;
          return result;
        }
        result += String.fromCharCode(byte);
      }

      return result;
    };


    return dicomParser;
  }(dicomParser));
  /**
   *
   * Internal helper class to assist with parsing. Supports reading from a byte
   * stream contained in a Uint8Array.  Example usage:
   *
   *  var byteArray = new Uint8Array(32);
   *  var byteStream = new dicomParser.ByteStream(dicomParser.littleEndianByteArrayParser, byteArray);
   *
   * */
  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * Constructor for ByteStream objects.
     * @param byteArrayParser a parser for parsing the byte array
     * @param byteArray a Uint8Array containing the byte stream
     * @param position (optional) the position to start reading from.  0 if not specified
     * @constructor
     * @throws will throw an error if the byteArrayParser parameter is not present
     * @throws will throw an error if the byteArray parameter is not present or invalid
     * @throws will throw an error if the position parameter is not inside the byte array
     */
    dicomParser.ByteStream = function(byteArrayParser, byteArray, position) {
      if(byteArrayParser === undefined)
      {
        throw "dicomParser.ByteStream: missing required parameter 'byteArrayParser'";
      }
      if(byteArray === undefined)
      {
        throw "dicomParser.ByteStream: missing required parameter 'byteArray'";
      }
      if((byteArray instanceof Uint8Array) === false) {
        throw 'dicomParser.ByteStream: parameter byteArray is not of type Uint8Array';
      }
      if(position < 0)
      {
        throw "dicomParser.ByteStream: parameter 'position' cannot be less than 0";
      }
      if(position >= byteArray.length)
      {
        throw "dicomParser.ByteStream: parameter 'position' cannot be greater than or equal to 'byteArray' length";

      }
      this.byteArrayParser = byteArrayParser;
      this.byteArray = byteArray;
      this.position = position ? position : 0;
      this.warnings = []; // array of string warnings encountered while parsing
    };

    /**
     * Safely seeks through the byte stream.  Will throw an exception if an attempt
     * is made to seek outside of the byte array.
     * @param offset the number of bytes to add to the position
     * @throws error if seek would cause position to be outside of the byteArray
     */
    dicomParser.ByteStream.prototype.seek = function(offset)
    {
      if(this.position + offset < 0)
      {
        throw "cannot seek to position < 0";
      }
      this.position += offset;
    };

    /**
     * Returns a new ByteStream object from the current position and of the requested number of bytes
     * @param numBytes the length of the byte array for the ByteStream to contain
     * @returns {dicomParser.ByteStream}
     * @throws error if buffer overread would occur
     */
    dicomParser.ByteStream.prototype.readByteStream = function(numBytes)
    {
      if(this.position + numBytes > this.byteArray.length) {
        throw 'readByteStream - buffer overread';
      }
      var byteArrayView = new Uint8Array(this.byteArray.buffer, this.position, numBytes);
      this.position += numBytes;
      return new dicomParser.ByteStream(this.byteArrayParser, byteArrayView);
    };

    /**
     *
     * Parses an unsigned int 16 from a byte array and advances
     * the position by 2 bytes
     *
     * @returns {*} the parsed unsigned int 16
     * @throws error if buffer overread would occur
     */
    dicomParser.ByteStream.prototype.readUint16 = function()
    {
      var result = this.byteArrayParser.readUint16(this.byteArray, this.position);
      this.position += 2;
      return result;
    };

    /**
     * Parses an unsigned int 32 from a byte array and advances
     * the position by 2 bytes
     *
     * @returns {*} the parse unsigned int 32
     * @throws error if buffer overread would occur
     */
    dicomParser.ByteStream.prototype.readUint32 = function()
    {
      var result = this.byteArrayParser.readUint32(this.byteArray, this.position);
      this.position += 4;
      return result;
    };

    /**
     * Reads a string of 8-bit characters from an array of bytes and advances
     * the position by length bytes.  A null terminator will end the string
     * but will not effect advancement of the position.
     * @param length the maximum number of bytes to parse
     * @returns {string} the parsed string
     * @throws error if buffer overread would occur
     */
    dicomParser.ByteStream.prototype.readFixedString = function(length)
    {
      var result = dicomParser.readFixedString(this.byteArray, this.position, length);
      this.position += length;
      return result;
    };

    return dicomParser;
  }(dicomParser));
  /**
   *
   * The DataSet class encapsulates a collection of DICOM Elements and provides various functions
   * to access the data in those elements
   *
   * Rules for handling padded spaces:
   * DS = Strip leading and trailing spaces
   * DT = Strip trailing spaces
   * IS = Strip leading and trailing spaces
   * PN = Strip trailing spaces
   * TM = Strip trailing spaces
   * AE = Strip leading and trailing spaces
   * CS = Strip leading and trailing spaces
   * SH = Strip leading and trailing spaces
   * LO = Strip leading and trailing spaces
   * LT = Strip trailing spaces
   * ST = Strip trailing spaces
   * UT = Strip trailing spaces
   *
   */
  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    function getByteArrayParser(element, defaultParser)
    {
      return (element.parser !== undefined ? element.parser : defaultParser);
    }

    /**
     * Constructs a new DataSet given byteArray and collection of elements
     * @param byteArrayParser
     * @param byteArray
     * @param elements
     * @constructor
     */
    dicomParser.DataSet = function(byteArrayParser, byteArray, elements)
    {
      this.byteArrayParser = byteArrayParser;
      this.byteArray = byteArray;
      this.elements = elements;
    };

    /**
     * Finds the element for tag and returns an unsigned int 16 if it exists and has data
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the value in a multivalued element.  Default is index 0 if not supplied
     * @returns {*} unsigned int 16 or undefined if the attribute is not present or has data of length 0
     */
    dicomParser.DataSet.prototype.uint16 = function(tag, index)
    {
      var element = this.elements[tag];
      index = (index !== undefined) ? index : 0;
      if(element && element.length !== 0)
      {
        return getByteArrayParser(element, this.byteArrayParser).readUint16(this.byteArray, element.dataOffset + (index *2));
      }
      return undefined;
    };

    /**
     * Finds the element for tag and returns an signed int 16 if it exists and has data
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the value in a multivalued element.  Default is index 0 if not supplied
     * @returns {*} signed int 16 or undefined if the attribute is not present or has data of length 0
     */
    dicomParser.DataSet.prototype.int16 = function(tag, index)
    {
      var element = this.elements[tag];
      index = (index !== undefined) ? index : 0;
      if(element && element.length !== 0)
      {
        return getByteArrayParser(element, this.byteArrayParser).readInt16(this.byteArray, element.dataOffset + (index * 2));
      }
      return undefined;
    };

    /**
     * Finds the element for tag and returns an unsigned int 32 if it exists and has data
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the value in a multivalued element.  Default is index 0 if not supplied
     * @returns {*} unsigned int 32 or undefined if the attribute is not present or has data of length 0
     */
    dicomParser.DataSet.prototype.uint32 = function(tag, index)
    {
      var element = this.elements[tag];
      index = (index !== undefined) ? index : 0;
      if(element && element.length !== 0)
      {
        return getByteArrayParser(element, this.byteArrayParser).readUint32(this.byteArray, element.dataOffset + (index * 4));
      }
      return undefined;
    };

    /**
     * Finds the element for tag and returns an signed int 32 if it exists and has data
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the value in a multivalued element.  Default is index 0 if not supplied
     * @returns {*} signed int 32 or undefined if the attribute is not present or has data of length 0
     */
    dicomParser.DataSet.prototype.int32 = function(tag, index)
    {
      var element = this.elements[tag];
      index = (index !== undefined) ? index : 0;
      if(element && element.length !== 0)
      {
        return getByteArrayParser(element, this.byteArrayParser).readInt32(this.byteArray, element.dataOffset + (index * 4));
      }
      return undefined;
    };

    /**
     * Finds the element for tag and returns a 32 bit floating point number (VR=FL) if it exists and has data
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the value in a multivalued element.  Default is index 0 if not supplied
     * @returns {*} float or undefined if the attribute is not present or has data of length 0
     */
    dicomParser.DataSet.prototype.float = function(tag, index)
    {
      var element = this.elements[tag];
      index = (index !== undefined) ? index : 0;
      if(element && element.length !== 0)
      {
        return getByteArrayParser(element, this.byteArrayParser).readFloat(this.byteArray, element.dataOffset + (index * 4));
      }
      return undefined;
    };

    /**
     * Finds the element for tag and returns a 64 bit floating point number (VR=FD) if it exists and has data
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the value in a multivalued element.  Default is index 0 if not supplied
     * @returns {*} float or undefined if the attribute is not present or doesn't has data of length 0
     */
    dicomParser.DataSet.prototype.double = function(tag, index)
    {
      var element = this.elements[tag];
      index = (index !== undefined) ? index : 0;
      if(element && element.length !== 0)
      {
        return getByteArrayParser(element, this.byteArrayParser).readDouble(this.byteArray, element.dataOffset + (index * 8));
      }
      return undefined;
    };

    /**
     * Returns the number of string values for the element
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @returns {*} the number of string values or undefined if the attribute is not present or has zero length data
     */
    dicomParser.DataSet.prototype.numStringValues = function(tag)
    {
      var element = this.elements[tag];
      if(element && element.length > 0)
      {
        var fixedString = dicomParser.readFixedString(this.byteArray, element.dataOffset, element.length);
        var numMatching = fixedString.match(/\\/g);
        if(numMatching === null)
        {
          return 1;
        }
        return numMatching.length + 1;
      }
      return undefined;
    };

    /**
     * Returns a string for the element.  If index is provided, the element is assumed to be
     * multi-valued and will return the component specified by index.  Undefined is returned
     * if there is no component with the specified index, the element does not exist or is zero length.
     *
     * Use this function for VR types of AE, CS, SH and LO
     *
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the desired value in a multi valued string or undefined for the entire string
     * @returns {*}
     */
    dicomParser.DataSet.prototype.string = function(tag, index)
    {
      var element = this.elements[tag];
      if(element && element.length > 0)
      {
        var fixedString = dicomParser.readFixedString(this.byteArray, element.dataOffset, element.length);
        if(index >= 0)
        {
          var values = fixedString.split('\\');
          // trim trailing spaces
          return values[index].trim();
        }
        else
        {
          // trim trailing spaces
          return fixedString.trim();
        }
      }
      return undefined;
    };

    /**
     * Returns a string with the leading spaces preserved and trailing spaces removed.
     *
     * Use this function to access data for VRs of type UT, ST and LT
     *
     * @param tag
     * @param index
     * @returns {*}
     */
    dicomParser.DataSet.prototype.text = function(tag, index)
    {
      var element = this.elements[tag];
      if(element && element.length > 0)
      {
        var fixedString = dicomParser.readFixedString(this.byteArray, element.dataOffset, element.length);
        if(index >= 0)
        {
          var values = fixedString.split('\\');
          return values[index].replace(/ +$/, '');
        }
        else
        {
          return fixedString.replace(/ +$/, '');
        }
      }
      return undefined;
    };

    /**
     * Parses a string to a float for the specified index in a multi-valued element.  If index is not specified,
     * the first value in a multi-valued VR will be parsed if present.
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the desired value in a multi valued string or undefined for the first value
     * @returns {*} a floating point number or undefined if not present or data not long enough
     */
    dicomParser.DataSet.prototype.floatString = function(tag, index)
    {
      var element = this.elements[tag];
      if(element && element.length > 0)
      {
        index = (index !== undefined) ? index : 0;
        var value = this.string(tag, index);
        if(value !== undefined) {
          return parseFloat(value);
        }
      }
      return undefined;
    };

    /**
     * Parses a string to an integer for the specified index in a multi-valued element.  If index is not specified,
     * the first value in a multi-valued VR will be parsed if present.
     * @param tag The DICOM tag in the format xGGGGEEEE
     * @param index the index of the desired value in a multi valued string or undefined for the first value
     * @returns {*} an integer or undefined if not present or data not long enough
     */
    dicomParser.DataSet.prototype.intString = function(tag, index)
    {
      var element = this.elements[tag];
      if(element && element.length > 0) {
        index = (index !== undefined) ? index : 0;
        var value = this.string(tag, index);
        if(value !== undefined) {
          return parseInt(value);
        }
      }
      return undefined;
    };

    //dicomParser.DataSet = DataSet;

    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * Reads an encapsulated pixel data element and adds an array of fragments to the element
     * containing the offset and length of each fragment and any offsets from the basic offset
     * table
     * @param byteStream
     * @param element
     */
    dicomParser.findEndOfEncapsulatedElement = function(byteStream, element, warnings)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.findEndOfEncapsulatedElement: missing required parameter 'byteStream'";
      }
      if(element === undefined)
      {
        throw "dicomParser.findEndOfEncapsulatedElement: missing required parameter 'element'";
      }

      element.encapsulatedPixelData = true;
      element.basicOffsetTable = [];
      element.fragments = [];
      var basicOffsetTableItemTag = dicomParser.readTag(byteStream);
      if(basicOffsetTableItemTag !== 'xfffee000') {
        throw "dicomParser.findEndOfEncapsulatedElement: basic offset table not found";
      }
      var basicOffsetTableItemlength = byteStream.readUint32();
      var numFragments = basicOffsetTableItemlength / 4;
      for(var i =0; i < numFragments; i++) {
        var offset = byteStream.readUint32();
        element.basicOffsetTable.push(offset);
      }
      var baseOffset = byteStream.position;

      while(byteStream.position < byteStream.byteArray.length)
      {
        var tag = dicomParser.readTag(byteStream);
        var length = byteStream.readUint32();
        if(tag === 'xfffee0dd')
        {
          byteStream.seek(length);
          element.length = byteStream.position - element.dataOffset;
          return;
        }
        else if(tag === 'xfffee000')
        {
          element.fragments.push({
            offset: byteStream.position - baseOffset - 8,
            position : byteStream.position,
            length : length
          });
        }
        else {
          if(warnings) {
            warnings.push('unexpected tag ' + tag + ' while searching for end of pixel data element with undefined length');
          }
          if(length > byteStream.byteArray.length - byteStream.position)
          {
            // fix length
            length = byteStream.byteArray.length - byteStream.position;
          }
          element.fragments.push({
            offset: byteStream.position - baseOffset - 8,
            position : byteStream.position,
            length : length
          });
          byteStream.seek(length);
          element.length = byteStream.position - element.dataOffset;
          return;
        }

        byteStream.seek(length);
      }

      if(warnings) {
        warnings.push("pixel data element " + element.tag + " missing sequence delimiter tag xfffee0dd");
      }
    };


    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * reads from the byte stream until it finds the magic numbers for the item delimitation item
     * and then sets the length of the element
     * @param byteStream
     * @param element
     */
    dicomParser.findItemDelimitationItemAndSetElementLength = function(byteStream, element)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readDicomElementImplicit: missing required parameter 'byteStream'";
      }

      var itemDelimitationItemLength = 8; // group, element, length
      var maxPosition = byteStream.byteArray.length - itemDelimitationItemLength;
      while(byteStream.position <= maxPosition)
      {
        var groupNumber = byteStream.readUint16();
        if(groupNumber === 0xfffe)
        {
          var elementNumber = byteStream.readUint16();
          if(elementNumber === 0xe00d)
          {
            // NOTE: It would be better to also check for the length to be 0 as part of the check above
            // but we will just log a warning for now
            var itemDelimiterLength = byteStream.readUint32(); // the length
            if(itemDelimiterLength !== 0) {
              byteStream.warnings('encountered non zero length following item delimiter at position' + byteStream.position - 4 + " while reading element of undefined length with tag ' + element.tag");
            }
            element.length = byteStream.position - element.dataOffset;
            return;
          }
        }
      }

      // No item delimitation item - silently set the length to the end of the buffer and set the position past the end of the buffer
      element.length = byteStream.byteArray.length - element.dataOffset;
      byteStream.seek(byteStream.byteArray.length - byteStream.position);
    };


    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing different types from a little-endian byte array
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    dicomParser.littleEndianByteArrayParser = {
      /**
       *
       * Parses an unsigned int 16 from a little-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed unsigned int 16
       * @throws error if buffer overread would occur
       * @access private
       */
      readUint16: function (byteArray, position) {
        if (position < 0) {
          throw 'littleEndianByteArrayParser.readUint16: position cannot be less than 0';
        }
        if (position + 2 > byteArray.length) {
          throw 'littleEndianByteArrayParser.readUint16: attempt to read past end of buffer';
        }
        return byteArray[position] + (byteArray[position + 1] * 256);
      },

      /**
       *
       * Parses a signed int 16 from a little-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed signed int 16
       * @throws error if buffer overread would occur
       * @access private
       */
      readInt16: function (byteArray, position) {
        if (position < 0) {
          throw 'littleEndianByteArrayParser.readInt16: position cannot be less than 0';
        }
        if (position + 2 > byteArray.length) {
          throw 'littleEndianByteArrayParser.readInt16: attempt to read past end of buffer';
        }
        var int16 = byteArray[position] + (byteArray[position + 1] << 8);
        // fix sign
        if (int16 & 0x8000) {
          int16 = int16 - 0xFFFF - 1;
        }
        return int16;
      },


      /**
       * Parses an unsigned int 32 from a little-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed unsigned int 32
       * @throws error if buffer overread would occur
       * @access private
       */
      readUint32: function (byteArray, position) {
        if (position < 0) {
          throw 'littleEndianByteArrayParser.readUint32: position cannot be less than 0';
        }

        if (position + 4 > byteArray.length) {
          throw 'littleEndianByteArrayParser.readUint32: attempt to read past end of buffer';
        }

        var uint32 = (byteArray[position] +
        (byteArray[position + 1] * 256) +
        (byteArray[position + 2] * 256 * 256) +
        (byteArray[position + 3] * 256 * 256 * 256 ));

        return uint32;
      },

      /**
       * Parses a signed int 32 from a little-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed unsigned int 32
       * @throws error if buffer overread would occur
       * @access private
       */
      readInt32: function (byteArray, position) {
        if (position < 0) {
          throw 'littleEndianByteArrayParser.readInt32: position cannot be less than 0';
        }

        if (position + 4 > byteArray.length) {
          throw 'littleEndianByteArrayParser.readInt32: attempt to read past end of buffer';
        }

        var int32 = (byteArray[position] +
        (byteArray[position + 1] << 8) +
        (byteArray[position + 2] << 16) +
        (byteArray[position + 3] << 24));

        return int32;

      },

      /**
       * Parses 32-bit float from a little-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed 32-bit float
       * @throws error if buffer overread would occur
       * @access private
       */
      readFloat: function (byteArray, position) {
        if (position < 0) {
          throw 'littleEndianByteArrayParser.readFloat: position cannot be less than 0';
        }

        if (position + 4 > byteArray.length) {
          throw 'littleEndianByteArrayParser.readFloat: attempt to read past end of buffer';
        }

        // I am sure there is a better way than this but this should be safe
        var byteArrayForParsingFloat = new Uint8Array(4);
        byteArrayForParsingFloat[0] = byteArray[position];
        byteArrayForParsingFloat[1] = byteArray[position + 1];
        byteArrayForParsingFloat[2] = byteArray[position + 2];
        byteArrayForParsingFloat[3] = byteArray[position + 3];
        var floatArray = new Float32Array(byteArrayForParsingFloat.buffer);
        return floatArray[0];
      },

      /**
       * Parses 64-bit float from a little-endian byte array
       *
       * @param byteArray the byte array to read from
       * @param position the position in the byte array to read from
       * @returns {*} the parsed 64-bit float
       * @throws error if buffer overread would occur
       * @access private
       */
      readDouble: function (byteArray, position) {
        if (position < 0) {
          throw 'littleEndianByteArrayParser.readDouble: position cannot be less than 0';
        }

        if (position + 8 > byteArray.length) {
          throw 'littleEndianByteArrayParser.readDouble: attempt to read past end of buffer';
        }

        // I am sure there is a better way than this but this should be safe
        var byteArrayForParsingFloat = new Uint8Array(8);
        byteArrayForParsingFloat[0] = byteArray[position];
        byteArrayForParsingFloat[1] = byteArray[position + 1];
        byteArrayForParsingFloat[2] = byteArray[position + 2];
        byteArrayForParsingFloat[3] = byteArray[position + 3];
        byteArrayForParsingFloat[4] = byteArray[position + 4];
        byteArrayForParsingFloat[5] = byteArray[position + 5];
        byteArrayForParsingFloat[6] = byteArray[position + 6];
        byteArrayForParsingFloat[7] = byteArray[position + 7];
        var floatArray = new Float64Array(byteArrayForParsingFloat.buffer);
        return floatArray[0];
      }
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing implicit and explicit DICOM data sets
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * reads an explicit data set
     * @param byteStream the byte stream to read from
     * @param maxPosition the maximum position to read up to (optional - only needed when reading sequence items)
     */
    dicomParser.parseDicomDataSetExplicit = function (dataSet, byteStream, maxPosition, options) {

      maxPosition = (maxPosition === undefined) ? byteStream.byteArray.length : maxPosition ;
      options = options || {};

      if(byteStream === undefined)
      {
        throw "dicomParser.parseDicomDataSetExplicit: missing required parameter 'byteStream'";
      }
      if(maxPosition < byteStream.position || maxPosition > byteStream.byteArray.length)
      {
        throw "dicomParser.parseDicomDataSetExplicit: invalid value for parameter 'maxPosition'";
      }
      var elements = dataSet.elements;

      while(byteStream.position < maxPosition)
      {
        var element = dicomParser.readDicomElementExplicit(byteStream, dataSet.warnings, options.untilTag);
        elements[element.tag] = element;
        if(element.tag === options.untilTag) {
          return;
        }
      }
      if(byteStream.position > maxPosition) {
        throw "dicomParser:parseDicomDataSetExplicit: buffer overrun";
      }
    };

    /**
     * reads an implicit data set
     * @param byteStream the byte stream to read from
     * @param maxPosition the maximum position to read up to (optional - only needed when reading sequence items)
     */
    dicomParser.parseDicomDataSetImplicit = function(dataSet, byteStream, maxPosition, options)
    {
      maxPosition = (maxPosition === undefined) ? dataSet.byteArray.length : maxPosition ;
      options = options || {};

      if(byteStream === undefined)
      {
        throw "dicomParser.parseDicomDataSetImplicit: missing required parameter 'byteStream'";
      }
      if(maxPosition < byteStream.position || maxPosition > byteStream.byteArray.length)
      {
        throw "dicomParser.parseDicomDataSetImplicit: invalid value for parameter 'maxPosition'";
      }

      var elements = dataSet.elements;

      while(byteStream.position < maxPosition)
      {
        var element = dicomParser.readDicomElementImplicit(byteStream, options.untilTag);
        elements[element.tag] = element;
        if(element.tag === options.untilTag) {
          return;
        }
      }
    };

    return dicomParser;
  }(dicomParser));

  /**
   * Internal helper functions for for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    function getDataLengthSizeInBytesForVR(vr)
    {
      if( vr === 'OB' ||
        vr === 'OW' ||
        vr === 'SQ' ||
        vr === 'OF' ||
        vr === 'UT' ||
        vr === 'UN')
      {
        return 4;
      }
      else
      {
        return 2;
      }
    }

    dicomParser.readDicomElementExplicit = function(byteStream, warnings, untilTag)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readDicomElementExplicit: missing required parameter 'byteStream'";
      }

      var element = {
        tag : dicomParser.readTag(byteStream),
        vr : byteStream.readFixedString(2)
        // length set below based on VR
        // dataOffset set below based on VR and size of length
      };

      var dataLengthSizeBytes = getDataLengthSizeInBytesForVR(element.vr);
      if(dataLengthSizeBytes === 2)
      {
        element.length = byteStream.readUint16();
        element.dataOffset = byteStream.position;
      }
      else
      {
        byteStream.seek(2);
        element.length = byteStream.readUint32();
        element.dataOffset = byteStream.position;
      }

      if(element.length === 4294967295)
      {
        element.hadUndefinedLength = true;
      }

      if(element.tag === untilTag) {
        return element;
      }

      // if VR is SQ, parse the sequence items
      if(element.vr === 'SQ')
      {
        dicomParser.readSequenceItemsExplicit(byteStream, element, warnings);
        return element;
      }
      if(element.length === 4294967295)
      {
        if(element.tag === 'x7fe00010') {
          dicomParser.findEndOfEncapsulatedElement(byteStream, element, warnings);
          return element;
        } else {
          dicomParser.findItemDelimitationItemAndSetElementLength(byteStream, element);
          return element;
        }
      }

      byteStream.seek(element.length);
      return element;
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    dicomParser.readDicomElementImplicit = function(byteStream, untilTag)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readDicomElementImplicit: missing required parameter 'byteStream'";
      }

      var element = {
        tag : dicomParser.readTag(byteStream),
        length: byteStream.readUint32(),
        dataOffset :  byteStream.position
      };

      if(element.length === 4294967295)
      {
        element.hadUndefinedLength = true;
      }

      if(element.tag === untilTag) {
        return element;
      }

      // peek ahead at the next tag to see if it looks like a sequence.  This is not 100%
      // safe because a non sequence item could have data that has these bytes, but this
      // is how to do it without a data dictionary.
      if ((byteStream.position + 4) <= byteStream.byteArray.length) {
        var nextTag = dicomParser.readTag(byteStream);
        byteStream.seek(-4);

        // zero length sequence
        if (element.hadUndefinedLength && nextTag === 'xfffee0dd') {
          element.length = 0;
          byteStream.seek(8);
          return element;
        }

        if (nextTag === 'xfffee000') {
          // parse the sequence
          dicomParser.readSequenceItemsImplicit(byteStream, element);
          //element.length = byteStream.byteArray.length - element.dataOffset;
          return element;
        }
      }

      // if element is not a sequence and has undefined length, we have to
      // scan the data for a magic number to figure out when it ends.
      if(element.length === 4294967295)
      {
        dicomParser.findItemDelimitationItemAndSetElementLength(byteStream, element);
        return element;
      }

      // non sequence element with known length, skip over the data part
      byteStream.seek(element.length);
      return element;
    };


    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    function readDicomDataSetExplicitUndefinedLength(byteStream, warnings)
    {
      var elements = {};

      while(byteStream.position < byteStream.byteArray.length)
      {
        var element = dicomParser.readDicomElementExplicit(byteStream, warnings);
        elements[element.tag] = element;

        // we hit an item delimiter tag, return the current offset to mark
        // the end of this sequence item
        if(element.tag === 'xfffee00d')
        {
          return new dicomParser.DataSet(byteStream.byteArrayParser, byteStream.byteArray, elements);
        }

      }

      // eof encountered - log a warning and return what we have for the element
      byteStream.warnings.push('eof encountered before finding sequence delimitation item while reading sequence item of undefined length');
      return new dicomParser.DataSet(byteStream.byteArrayParser, byteStream.byteArray, elements);
    }

    function readSequenceItemExplicit(byteStream, warnings)
    {
      var item = dicomParser.readSequenceItem(byteStream);

      if(item.length === 4294967295)
      {
        item.hadUndefinedLength = true;
        item.dataSet = readDicomDataSetExplicitUndefinedLength(byteStream, warnings);
        item.length = byteStream.position - item.dataOffset;
      }
      else
      {
        item.dataSet = new dicomParser.DataSet(byteStream.byteArrayParser, byteStream.byteArray, {});
        dicomParser.parseDicomDataSetExplicit(item.dataSet, byteStream, byteStream.position + item.length);
      }
      return item;
    }

    function readSQElementUndefinedLengthExplicit(byteStream, element, warnings)
    {
      while(byteStream.position < byteStream.byteArray.length)
      {
        // end reading this sequence if the next tag is the sequence delimitation item
        var nextTag = dicomParser.readTag(byteStream);
        byteStream.seek(-4);
        if (nextTag === 'xfffee0dd') {
          // set the correct length
          element.length = byteStream.position - element.dataOffset;
          byteStream.seek(8);
          return element;
        }

        var item = readSequenceItemExplicit(byteStream, warnings);
        element.items.push(item);
      }
      element.length = byteStream.position - element.dataOffset;
    }

    function readSQElementKnownLengthExplicit(byteStream, element, warnings)
    {
      var maxPosition = element.dataOffset + element.length;
      while(byteStream.position < maxPosition)
      {
        var item = readSequenceItemExplicit(byteStream, warnings);
        element.items.push(item);
      }
    }

    dicomParser.readSequenceItemsExplicit = function(byteStream, element, warnings)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readSequenceItemsExplicit: missing required parameter 'byteStream'";
      }
      if(element === undefined)
      {
        throw "dicomParser.readSequenceItemsExplicit: missing required parameter 'element'";
      }

      element.items = [];

      if(element.length === 4294967295)
      {
        readSQElementUndefinedLengthExplicit(byteStream, element);
      }
      else
      {
        readSQElementKnownLengthExplicit(byteStream, element, warnings);
      }
    };


    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    function readDicomDataSetImplicitUndefinedLength(byteStream)
    {
      var elements = {};

      while(byteStream.position < byteStream.byteArray.length)
      {
        var element = dicomParser.readDicomElementImplicit(byteStream);
        elements[element.tag] = element;

        // we hit an item delimiter tag, return the current offset to mark
        // the end of this sequence item
        if(element.tag === 'xfffee00d')
        {
          return new dicomParser.DataSet(byteStream.byteArrayParser, byteStream.byteArray, elements);
        }
      }
      // eof encountered - log a warning and return what we have for the element
      byteStream.warnings.push('eof encountered before finding sequence item delimiter in sequence item of undefined length');
      return new dicomParser.DataSet(byteStream.byteArrayParser, byteStream.byteArray, elements);
    }

    function readSequenceItemImplicit(byteStream)
    {
      var item = dicomParser.readSequenceItem(byteStream);

      if(item.length === 4294967295)
      {
        item.hadUndefinedLength = true;
        item.dataSet = readDicomDataSetImplicitUndefinedLength(byteStream);
        item.length = byteStream.position - item.dataOffset;
      }
      else
      {
        item.dataSet = new dicomParser.DataSet(byteStream.byteArrayParser, byteStream.byteArray, {});
        dicomParser.parseDicomDataSetImplicit(item.dataSet, byteStream, byteStream.position + item.length);
      }
      return item;
    }

    function readSQElementUndefinedLengthImplicit(byteStream, element)
    {
      while(byteStream.position < byteStream.byteArray.length)
      {
        // end reading this sequence if the next tag is the sequence delimitation item
        var nextTag = dicomParser.readTag(byteStream);
        byteStream.seek(-4);
        if (nextTag === 'xfffee0dd') {
          // set the correct length
          element.length = byteStream.position - element.dataOffset;
          byteStream.seek(8);
          return element;
        }

        var item = readSequenceItemImplicit(byteStream);
        element.items.push(item);
      }
      element.length = byteStream.byteArray.length - element.dataOffset;
    }

    function readSQElementKnownLengthImplicit(byteStream, element)
    {
      var maxPosition = element.dataOffset + element.length;
      while(byteStream.position < maxPosition)
      {
        var item = readSequenceItemImplicit(byteStream);
        element.items.push(item);
      }
    }

    /**
     * Reads sequence items for an element in an implicit little endian byte stream
     * @param byteStream the implicit little endian byte stream
     * @param element the element to read the sequence items for
     */
    dicomParser.readSequenceItemsImplicit = function(byteStream, element)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readSequenceItemsImplicit: missing required parameter 'byteStream'";
      }
      if(element === undefined)
      {
        throw "dicomParser.readSequenceItemsImplicit: missing required parameter 'element'";
      }

      element.items = [];

      if(element.length === 4294967295)
      {
        readSQElementUndefinedLengthImplicit(byteStream, element);
      }
      else
      {
        readSQElementKnownLengthImplicit(byteStream, element);
      }
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * Reads the tag and length of a sequence item and returns them as an object with the following properties
     *  tag : string for the tag of this element in the format xggggeeee
     *  length: the number of bytes in this item or 4294967295 if undefined
     *  dataOffset: the offset into the byteStream of the data for this item
     * @param byteStream the byte
     * @returns {{tag: string, length: integer, dataOffset: integer}}
     */
    dicomParser.readSequenceItem = function(byteStream)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readSequenceItem: missing required parameter 'byteStream'";
      }

      var element = {
        tag : dicomParser.readTag(byteStream),
        length : byteStream.readUint32(),
        dataOffset :  byteStream.position
      };

      return element;
    };


    return dicomParser;
  }(dicomParser));
  /**
   * Internal helper functions for parsing DICOM elements
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    /**
     * Reads a tag (group number and element number) from a byteStream
     * @param byteStream the byte stream to read from
     * @returns {string} the tag in format xggggeeee where gggg is the lowercase hex value of the group number
     * and eeee is the lower case hex value of the element number
     */
    dicomParser.readTag = function(byteStream)
    {
      if(byteStream === undefined)
      {
        throw "dicomParser.readTag: missing required parameter 'byteStream'";
      }

      var groupNumber =  byteStream.readUint16() * 256 * 256;
      var elementNumber = byteStream.readUint16();
      var tag = "x" + ('00000000' + (groupNumber + elementNumber).toString(16)).substr(-8);
      return tag;
    };

    return dicomParser;
  }(dicomParser));
  /**
   * Version
   */

  var dicomParser = (function (dicomParser)
  {
    "use strict";

    if(dicomParser === undefined)
    {
      dicomParser = {};
    }

    dicomParser.version = "1.1.5";

    return dicomParser;
  }(dicomParser));
  return dicomParser;
}));