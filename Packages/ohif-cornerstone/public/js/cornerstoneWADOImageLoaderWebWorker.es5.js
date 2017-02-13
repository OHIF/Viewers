/*! cornerstone-wado-image-loader - v0.14.1 - 2017-02-11 | (c) 2016 Chris Hafey | https://github.com/chafey/cornerstoneWADOImageLoader */

cornerstoneWADOImageLoaderWebWorker = {
  registerTaskHandler : undefined
};

(function () {


  // an object of task handlers
  var taskHandlers = {};

  // Flag to ensure web worker is only initialized once
  var initialized = false;

  // the configuration object passed in when the web worker manager is initialized
  var config;

  /**
   * Initialization function that loads additional web workers and initializes them
   * @param data
   */
  function initialize(data) {
    //console.log('web worker initialize ', data.workerIndex);
    // prevent initialization from happening more than once
    if(initialized) {
      return;
    }

    // save the config data
    config = data.config;

    // load any additional web worker tasks
    if(data.config.webWorkerTaskPaths) {
      for(var i=0; i < data.config.webWorkerTaskPaths.length; i++) {
        self.importScripts(data.config.webWorkerTaskPaths[i]);
      }
    }

    // initialize each task handler
    Object.keys(taskHandlers).forEach(function(key) {
      taskHandlers[key].initialize(config.taskConfiguration);
    });

    // tell main ui thread that we have completed initialization
    self.postMessage({
      taskType: 'initialize',
      status: 'success',
      result: {
      },
      workerIndex: data.workerIndex
    });

    initialized = true;
  }

  /**
   * Function exposed to web worker tasks to register themselves
   * @param taskHandler
   */
  cornerstoneWADOImageLoaderWebWorker.registerTaskHandler = function(taskHandler) {
    if(taskHandlers[taskHandler.taskType]) {
      console.log('attempt to register duplicate task handler "', taskHandler.taskType, '"');
      return false;
    }
    taskHandlers[taskHandler.taskType] = taskHandler;
    if(initialized) {
      taskHandler.initialize(config.taskConfiguration);
    }
  };

  /**
   * Function to load a new web worker task with updated configuration
   * @param data
   */
  function loadWebWorkerTask(data) {
    config = data.config;
    self.importScripts(data.sourcePath);
  }

  /**
   * Web worker message handler - dispatches messages to the registered task handlers
   * @param msg
   */
  self.onmessage = function(msg) {
    //console.log('web worker onmessage', msg.data);

    // handle initialize message
    if(msg.data.taskType === 'initialize') {
      initialize(msg.data);
      return;
    }

    // handle loadWebWorkerTask message
    if(msg.data.taskType === 'loadWebWorkerTask') {
      loadWebWorkerTask(msg.data);
      return;
    }

    // dispatch the message if there is a handler registered for it
    if(taskHandlers[msg.data.taskType]) {
      taskHandlers[msg.data.taskType].handler(msg.data, function(result, transferList) {
        self.postMessage({
          taskType: msg.data.taskType,
          status: 'success',
          result: result,
          workerIndex: msg.data.workerIndex
        }, transferList);
      });
      return;
    }

    // not task handler registered - send a failure message back to ui thread
    console.log('no task handler for ', msg.data.taskType);
    console.log(taskHandlers);
    self.postMessage({
      taskType: msg.data.taskType,
      status: 'failed - no task handler registered',
      workerIndex: msg.data.workerIndex
    });
  };

}());

cornerstoneWADOImageLoader = {};

(function () {

  // flag to ensure codecs are loaded only once
  var codecsLoaded = false;

  // the configuration object for the decodeTask
  var decodeConfig;

  /**
   * Function to control loading and initializing the codecs
   * @param config
   */
  function loadCodecs(config) {
    // prevent loading codecs more than once
    if (codecsLoaded) {
      return;
    }

    // Load the codecs
    //console.time('loadCodecs');
    self.importScripts(config.decodeTask.codecsPath);
    codecsLoaded = true;
    //console.timeEnd('loadCodecs');

    // Initialize the codecs
    if (config.decodeTask.initializeCodecsOnStartup) {
      //console.time('initializeCodecs');
      cornerstoneWADOImageLoader.initializeJPEG2000(config.decodeTask);
      cornerstoneWADOImageLoader.initializeJPEGLS(config.decodeTask);
      //console.timeEnd('initializeCodecs');
    }
  }

  /**
   * Task initialization function
   */
  function decodeTaskInitialize(config) {
    decodeConfig = config;
    if (config.decodeTask.loadCodecsOnStartup) {
      loadCodecs(config);
    }
  }

  function calculateMinMax(imageFrame) {
    if (imageFrame.smallestPixelValue !== undefined && imageFrame.largestPixelValue !== undefined) {
      return;
    }

    var minMax = cornerstoneWADOImageLoader.getMinMax(imageFrame.pixelData);
    imageFrame.smallestPixelValue = minMax.min;
    imageFrame.largestPixelValue = minMax.max;
  }

  /**
   * Task handler function
   */
  function decodeTaskHandler(data, doneCallback) {
    // Load the codecs if they aren't already loaded
    loadCodecs(decodeConfig);

    var imageFrame = data.data.imageFrame;

    // convert pixel data from ArrayBuffer to Uint8Array since web workers support passing ArrayBuffers but
    // not typed arrays
    var pixelData = new Uint8Array(data.data.pixelData);

    cornerstoneWADOImageLoader.decodeImageFrame(
      imageFrame,
      data.data.transferSyntax,
      pixelData,
      decodeConfig.decodeTask,
      data.data.options);

    calculateMinMax(imageFrame);

    // convert from TypedArray to ArrayBuffer since web workers support passing ArrayBuffers but not
    // typed arrays
    imageFrame.pixelData = imageFrame.pixelData.buffer;

    // invoke the callback with our result and pass the pixelData in the transferList to move it to
    // UI thread without making a copy
    doneCallback(imageFrame, [imageFrame.pixelData]);
  }

  // register our task
  cornerstoneWADOImageLoaderWebWorker.registerTaskHandler({
    taskType: 'decodeTask',
    handler: decodeTaskHandler,
    initialize: decodeTaskInitialize
  });
}());

/**
 */
(function (cornerstoneWADOImageLoader) {

  "use strict";

  function decodeImageFrame(imageFrame, transferSyntax, pixelData, decodeConfig, options) {
    var start = new Date().getTime();

    // Implicit VR Little Endian
    if(transferSyntax === "1.2.840.10008.1.2") {
      imageFrame = cornerstoneWADOImageLoader.decodeLittleEndian(imageFrame, pixelData);
    }
    // Explicit VR Little Endian
    else if(transferSyntax === "1.2.840.10008.1.2.1") {
      imageFrame = cornerstoneWADOImageLoader.decodeLittleEndian(imageFrame, pixelData);
    }
    // Explicit VR Big Endian (retired)
    else if (transferSyntax === "1.2.840.10008.1.2.2" ) {
      imageFrame = cornerstoneWADOImageLoader.decodeBigEndian(imageFrame, pixelData);
    }
    // Deflate transfer syntax (deflated by dicomParser)
    else if(transferSyntax === '1.2.840.10008.1.2.1.99') {
      imageFrame = cornerstoneWADOImageLoader.decodeLittleEndian(imageFrame, pixelData);
    }
    // RLE Lossless
    else if (transferSyntax === "1.2.840.10008.1.2.5" )
    {
      imageFrame = cornerstoneWADOImageLoader.decodeRLE(imageFrame, pixelData);
    }
    // JPEG Baseline lossy process 1 (8 bit)
    else if (transferSyntax === "1.2.840.10008.1.2.4.50")
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEGBaseline(imageFrame, pixelData);
    }
    // JPEG Baseline lossy process 2 & 4 (12 bit)
    else if (transferSyntax === "1.2.840.10008.1.2.4.51")
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEGBaseline(imageFrame, pixelData);
    }
    // JPEG Lossless, Nonhierarchical (Processes 14)
    else if (transferSyntax === "1.2.840.10008.1.2.4.57")
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEGLossless(imageFrame, pixelData);
    }
    // JPEG Lossless, Nonhierarchical (Processes 14 [Selection 1])
    else if (transferSyntax === "1.2.840.10008.1.2.4.70" )
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEGLossless(imageFrame, pixelData);
    }
    // JPEG-LS Lossless Image Compression
    else if (transferSyntax === "1.2.840.10008.1.2.4.80" )
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEGLS(imageFrame, pixelData);
    }
    // JPEG-LS Lossy (Near-Lossless) Image Compression
    else if (transferSyntax === "1.2.840.10008.1.2.4.81" )
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEGLS(imageFrame, pixelData);
    }
    // JPEG 2000 Lossless
    else if (transferSyntax === "1.2.840.10008.1.2.4.90")
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEG2000(imageFrame, pixelData, decodeConfig, options);
    }
    // JPEG 2000 Lossy
    else if (transferSyntax === "1.2.840.10008.1.2.4.91")
    {
      imageFrame = cornerstoneWADOImageLoader.decodeJPEG2000(imageFrame, pixelData, decodeConfig, options);
    }
    /* Don't know if these work...
     // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
     else if(transferSyntax === "1.2.840.10008.1.2.4.92")
     {
     return cornerstoneWADOImageLoader.decodeJPEG2000(dataSet, frame);
     }
     // JPEG 2000 Part 2 Multicomponent Image Compression
     else if(transferSyntax === "1.2.840.10008.1.2.4.93")
     {
     return cornerstoneWADOImageLoader.decodeJPEG2000(dataSet, frame);
     }
     */
    else
    {
      if(console && console.log) {
        console.log("Image cannot be decoded due to Unsupported transfer syntax " + transferSyntax);
      }
      throw "no decoder for transfer syntax " + transferSyntax;
    }

    var end = new Date().getTime();
    imageFrame.decodeTimeInMS = end - start;

    return imageFrame;
  }

  cornerstoneWADOImageLoader.decodeImageFrame = decodeImageFrame;
}(cornerstoneWADOImageLoader));
/**
 */
(function (cornerstoneWADOImageLoader) {

  function swap16(val) {
    return ((val & 0xFF) << 8)
      | ((val >> 8) & 0xFF);
  }


  function decodeBigEndian(imageFrame, pixelData) {
    if(imageFrame.bitsAllocated === 16) {
      var arrayBuffer = pixelData.buffer;
      var offset = pixelData.byteOffset;
      var length = pixelData.length;
      // if pixel data is not aligned on even boundary, shift it so we can create the 16 bit array
      // buffers on it
      if(offset % 2) {
        arrayBuffer = arrayBuffer.slice(offset);
        offset = 0;
      }

      if(imageFrame.pixelRepresentation === 0) {
        imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
      } else {
        imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
      }
      // Do the byte swap
      for(var i=0; i < imageFrame.pixelData.length; i++) {
        imageFrame[i] = swap16(imageFrame.pixelData[i]);
      }

    } else if(imageFrame.bitsAllocated === 8) {
      imageFrame.pixelData = pixelData;
    }
    return imageFrame;
  }

  // module exports
  cornerstoneWADOImageLoader.decodeBigEndian = decodeBigEndian;

}(cornerstoneWADOImageLoader));
(function (cornerstoneWADOImageLoader) {

  "use strict";

  function decodeJpx(imageFrame, pixelData) {

    var jpxImage = new JpxImage();
    jpxImage.parse(pixelData);

    var tileCount = jpxImage.tiles.length;
    if(tileCount !== 1) {
      throw 'JPEG2000 decoder returned a tileCount of ' + tileCount + ', when 1 is expected';
    }

    imageFrame.columns = jpxImage.width;
    imageFrame.rows = jpxImage.height;
    imageFrame.pixelData = jpxImage.tiles[0].items;
    return imageFrame;
  }

  var openJPEG;

  function decodeOpenJPEG(data, bytesPerPixel, signed) {
    var dataPtr = openJPEG._malloc(data.length);
    openJPEG.writeArrayToMemory(data, dataPtr);

    // create param outpout
    var imagePtrPtr=openJPEG._malloc(4);
    var imageSizePtr=openJPEG._malloc(4);
    var imageSizeXPtr=openJPEG._malloc(4);
    var imageSizeYPtr=openJPEG._malloc(4);
    var imageSizeCompPtr=openJPEG._malloc(4);

    var t0 = Date.now();
    var ret = openJPEG.ccall('jp2_decode','number', ['number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [dataPtr, data.length, imagePtrPtr, imageSizePtr, imageSizeXPtr, imageSizeYPtr, imageSizeCompPtr]);
    // add num vomp..etc
    if(ret !== 0){
      console.log('[opj_decode] decoding failed!');
      openJPEG._free(dataPtr);
      openJPEG._free(openJPEG.getValue(imagePtrPtr, '*'));
      openJPEG._free(imageSizeXPtr);
      openJPEG._free(imageSizeYPtr);
      openJPEG._free(imageSizePtr);
      openJPEG._free(imageSizeCompPtr);
      return undefined;
    }

    var imagePtr = openJPEG.getValue(imagePtrPtr, '*')

    var image = {
      length : openJPEG.getValue(imageSizePtr,'i32'),
      sx :  openJPEG.getValue(imageSizeXPtr,'i32'),
      sy :  openJPEG.getValue(imageSizeYPtr,'i32'),
      nbChannels : openJPEG.getValue(imageSizeCompPtr,'i32'), // hard coded for now
      perf_timetodecode : undefined,
      pixelData : undefined
    };

    // Copy the data from the EMSCRIPTEN heap into the correct type array
    var length = image.sx*image.sy*image.nbChannels;
    var src32 = new Int32Array(openJPEG.HEAP32.buffer, imagePtr, length);
    if(bytesPerPixel === 1) {
      if(Uint8Array.from) {
        image.pixelData = Uint8Array.from(src32);
      } else {
        image.pixelData = new Uint8Array(length);
        for(var i=0; i < length; i++) {
          image.pixelData[i] = src32[i];
        }
      }
    } else {
      if (signed) {
        if(Int16Array.from) {
          image.pixelData = Int16Array.from(src32);
        } else {
          image.pixelData = new Int16Array(length);
          for(var i=0; i < length; i++) {
            image.pixelData[i] = src32[i];
          }
        }
      } else {
        if(Uint16Array.from) {
          image.pixelData = Uint16Array.from(src32);
        } else {
          image.pixelData = new Uint16Array(length);
          for(var i=0; i < length; i++) {
            image.pixelData[i] = src32[i];
          }
        }
      }
    }

    var t1 = Date.now();
    image.perf_timetodecode = t1-t0;

    // free
    openJPEG._free(dataPtr);
    openJPEG._free(imagePtrPtr);
    openJPEG._free(imagePtr);
    openJPEG._free(imageSizePtr);
    openJPEG._free(imageSizeXPtr);
    openJPEG._free(imageSizeYPtr);
    openJPEG._free(imageSizeCompPtr);

    return image;
  }

  function decodeOpenJpeg2000(imageFrame, pixelData) {
    var bytesPerPixel = imageFrame.bitsAllocated <= 8 ? 1 : 2;
    var signed = imageFrame.pixelRepresentation === 1;

    var image = decodeOpenJPEG(pixelData, bytesPerPixel, signed);

    imageFrame.columns = image.sx;
    imageFrame.rows = image.sy;
    imageFrame.pixelData = image.pixelData;
    if(image.nbChannels > 1) {
      imageFrame.photometricInterpretation = "RGB";
    }
    return imageFrame;
  }

  function initializeJPEG2000(decodeConfig) {
    // check to make sure codec is loaded
    if(!decodeConfig.usePDFJS) {
      if(typeof OpenJPEG === 'undefined') {
        throw 'OpenJPEG decoder not loaded';
      }
    }

    if (!openJPEG) {
      openJPEG = OpenJPEG();
      if (!openJPEG || !openJPEG._jp2_decode) {
        throw 'OpenJPEG failed to initialize';
      }
    }
  }

  function decodeJPEG2000(imageFrame, pixelData, decodeConfig, options)
  {
    options = options || {};

    initializeJPEG2000(decodeConfig);

    if(options.usePDFJS || decodeConfig.usePDFJS) {
      // OHIF image-JPEG2000 https://github.com/OHIF/image-JPEG2000
      //console.log('PDFJS')
      return decodeJpx(imageFrame, pixelData);
    } else {
      // OpenJPEG2000 https://github.com/jpambrun/openjpeg
      //console.log('OpenJPEG')
      return decodeOpenJpeg2000(imageFrame, pixelData);
    }
  }

  cornerstoneWADOImageLoader.decodeJPEG2000 = decodeJPEG2000;
  cornerstoneWADOImageLoader.initializeJPEG2000 = initializeJPEG2000;

}(cornerstoneWADOImageLoader));
(function (cornerstoneWADOImageLoader) {

  "use strict";

  function decodeJPEGBaseline(imageFrame, pixelData)
  {
    // check to make sure codec is loaded
    if(typeof JpegImage === 'undefined') {
      throw 'No JPEG Baseline decoder loaded';
    }
    var jpeg = new JpegImage();
    jpeg.parse(pixelData);
    if(imageFrame.bitsAllocated === 8) {
      imageFrame.pixelData = jpeg.getData(imageFrame.columns, imageFrame.rows);
      return imageFrame;
    }
    else if(imageFrame.bitsAllocated === 16) {
      imageFrame.pixelData = jpeg.getData16(imageFrame.columns, imageFrame.rows);
      return imageFrame;
    }
  }

  cornerstoneWADOImageLoader.decodeJPEGBaseline = decodeJPEGBaseline;
}(cornerstoneWADOImageLoader));
"use strict";
(function (cornerstoneWADOImageLoader) {

  function decodeJPEGLossless(imageFrame, pixelData) {
    // check to make sure codec is loaded
    if(typeof jpeg === 'undefined' ||
      typeof jpeg.lossless === 'undefined' ||
      typeof jpeg.lossless.Decoder === 'undefined') {
      throw 'No JPEG Lossless decoder loaded';
    }

    var byteOutput = imageFrame.bitsAllocated <= 8 ? 1 : 2;
    //console.time('jpeglossless');
    var buffer = pixelData.buffer;
    var decoder = new jpeg.lossless.Decoder();
    var decompressedData = decoder.decode(buffer, buffer.byteOffset, buffer.length, byteOutput);
    //console.timeEnd('jpeglossless');
    if (imageFrame.pixelRepresentation === 0) {
      if (imageFrame.bitsAllocated === 16) {
        imageFrame.pixelData = new Uint16Array(decompressedData.buffer);
        return imageFrame;
      } else {
        // untested!
        imageFrame.pixelData = new Uint8Array(decompressedData.buffer);
        return imageFrame;
      }
    } else {
      imageFrame.pixelData = new Int16Array(decompressedData.buffer);
      return imageFrame;
    }
  }
  // module exports
  cornerstoneWADOImageLoader.decodeJPEGLossless = decodeJPEGLossless;

}(cornerstoneWADOImageLoader));
"use strict";
(function (cornerstoneWADOImageLoader) {


  var charLS;

  function jpegLSDecode(data, isSigned) {

    // prepare input parameters
    var dataPtr = charLS._malloc(data.length);
    charLS.writeArrayToMemory(data, dataPtr);

    // prepare output parameters
    var imagePtrPtr=charLS._malloc(4);
    var imageSizePtr=charLS._malloc(4);
    var widthPtr=charLS._malloc(4);
    var heightPtr=charLS._malloc(4);
    var bitsPerSamplePtr=charLS._malloc(4);
    var stridePtr=charLS._malloc(4);
    var allowedLossyErrorPtr =charLS._malloc(4);
    var componentsPtr=charLS._malloc(4);
    var interleaveModePtr=charLS._malloc(4);

    // Decode the image
    var result = charLS.ccall(
      'jpegls_decode',
      'number',
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [dataPtr, data.length, imagePtrPtr, imageSizePtr, widthPtr, heightPtr, bitsPerSamplePtr, stridePtr, componentsPtr, allowedLossyErrorPtr, interleaveModePtr]
    );

    // Extract result values into object
    var image = {
      result : result,
      width : charLS.getValue(widthPtr,'i32'),
      height : charLS.getValue(heightPtr,'i32'),
      bitsPerSample : charLS.getValue(bitsPerSamplePtr,'i32'),
      stride : charLS.getValue(stridePtr,'i32'),
      components : charLS.getValue(componentsPtr, 'i32'),
      allowedLossyError : charLS.getValue(allowedLossyErrorPtr, 'i32'),
      interleaveMode: charLS.getValue(interleaveModePtr, 'i32'),
      pixelData: undefined
    };

    // Copy image from emscripten heap into appropriate array buffer type
    var imagePtr = charLS.getValue(imagePtrPtr, '*');
    if(image.bitsPerSample <= 8) {
      image.pixelData = new Uint8Array(image.width * image.height * image.components);
      image.pixelData.set(new Uint8Array(charLS.HEAP8.buffer, imagePtr, image.pixelData.length));
    } else {
      // I have seen 16 bit signed images, but I don't know if 16 bit unsigned is valid, hoping to get
      // answer here:
      // https://github.com/team-charls/charls/issues/14
      if(isSigned) {
        image.pixelData = new Int16Array(image.width * image.height * image.components);
        image.pixelData.set(new Int16Array(charLS.HEAP16.buffer, imagePtr, image.pixelData.length));
      } else {
        image.pixelData = new Uint16Array(image.width * image.height * image.components);
        image.pixelData.set(new Uint16Array(charLS.HEAP16.buffer, imagePtr, image.pixelData.length));
      }
    }

    // free memory and return image object
    charLS._free(dataPtr);
    charLS._free(imagePtr);
    charLS._free(imagePtrPtr);
    charLS._free(imageSizePtr);
    charLS._free(widthPtr);
    charLS._free(heightPtr);
    charLS._free(bitsPerSamplePtr);
    charLS._free(stridePtr);
    charLS._free(componentsPtr);
    charLS._free(interleaveModePtr);

    return image;
  }

  function initializeJPEGLS() {
    // check to make sure codec is loaded
    if(typeof CharLS === 'undefined') {
      throw 'No JPEG-LS decoder loaded';
    }

    // Try to initialize CharLS
    // CharLS https://github.com/chafey/charls
    if(!charLS) {
      charLS = CharLS();
      if(!charLS || !charLS._jpegls_decode) {
        throw 'JPEG-LS failed to initialize';
      }
    }

  }

  function decodeJPEGLS(imageFrame, pixelData)
  {
    initializeJPEGLS();

    var image = jpegLSDecode(pixelData, imageFrame.pixelRepresentation === 1);
    //console.log(image);

    // throw error if not success or too much data
    if(image.result !== 0 && image.result !== 6) {
      throw 'JPEG-LS decoder failed to decode frame (error code ' + image.result + ')';
    }

    imageFrame.columns = image.width;
    imageFrame.rows = image.height;
    imageFrame.pixelData = image.pixelData;
    return imageFrame;
  }

  // module exports
  cornerstoneWADOImageLoader.decodeJPEGLS = decodeJPEGLS;
  cornerstoneWADOImageLoader.initializeJPEGLS = initializeJPEGLS;

}(cornerstoneWADOImageLoader));
/**
 */
(function (cornerstoneWADOImageLoader) {

  function decodeLittleEndian(imageFrame, pixelData) {
    if(imageFrame.bitsAllocated === 16) {
      var arrayBuffer = pixelData.buffer;
      var offset = pixelData.byteOffset;
      var length = pixelData.length;
      // if pixel data is not aligned on even boundary, shift it so we can create the 16 bit array
      // buffers on it
      if(offset % 2) {
        arrayBuffer = arrayBuffer.slice(offset);
        offset = 0;
      }

      if(imageFrame.pixelRepresentation === 0) {
        imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
      } else {
        imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
      }
    } else if(imageFrame.bitsAllocated === 8) {
      imageFrame.pixelData = pixelData;
    }
    return imageFrame;
  }

  // module exports
  cornerstoneWADOImageLoader.decodeLittleEndian = decodeLittleEndian;

}(cornerstoneWADOImageLoader));
/**
 */
(function (cornerstoneWADOImageLoader) {

  function decodeRLE(imageFrame, pixelData) {

    if(imageFrame.bitsAllocated === 8) {
      return decode8(imageFrame, pixelData);
    } else if( imageFrame.bitsAllocated === 16) {
      return decode16(imageFrame, pixelData);
    } else {
      throw 'unsupported pixel format for RLE'
    }
  }

  function decode8(imageFrame, pixelData ) {
    var frameData = pixelData;
    var frameSize = imageFrame.rows * imageFrame.columns;
    var outFrame = new ArrayBuffer(frameSize*imageFrame.samplesPerPixel);
    var header=new DataView(frameData.buffer, frameData.byteOffset);
    var data=new DataView( frameData.buffer, frameData.byteOffset );
    var out=new DataView( outFrame );

    var outIndex=0;
    var numSegments = header.getInt32(0,true);
    for( var s=0 ; s < numSegments ; ++s ) {
      outIndex = s;

      var inIndex=header.getInt32( (s+1)*4,true);
      var maxIndex=header.getInt32( (s+2)*4,true);
      if( maxIndex===0 )
        maxIndex = frameData.length;

      var endOfSegment = frameSize * numSegments;

      while( inIndex < maxIndex ) {
        var n=data.getInt8(inIndex++);
        if( n >=0 && n <=127 ) {
          // copy n bytes
          for( var i=0 ; i < n+1 && outIndex < endOfSegment; ++i ) {
            out.setInt8(outIndex, data.getInt8(inIndex++));
            outIndex+=imageFrame.samplesPerPixel;
          }
        } else if( n<= -1 && n>=-127 ) {
          var value=data.getInt8(inIndex++);
          // run of n bytes
          for( var j=0 ; j < -n+1 && outIndex < endOfSegment; ++j ) {
            out.setInt8(outIndex, value );
            outIndex+=imageFrame.samplesPerPixel;
          }
        } else if (n===-128)
          ; // do nothing
      }
    }
    imageFrame.pixelData = new Uint8Array(outFrame);
    return imageFrame;
  }

  function decode16( imageFrame, pixelData ) {
    var frameData = pixelData;
    var frameSize = imageFrame.rows * imageFrame.columns;
    var outFrame = new ArrayBuffer(frameSize*imageFrame.samplesPerPixel*2);

    var header=new DataView(frameData.buffer, frameData.byteOffset);
    var data=new DataView( frameData.buffer, frameData.byteOffset );
    var out=new DataView( outFrame );

    var numSegments = header.getInt32(0,true);
    for( var s=0 ; s < numSegments ; ++s ) {
      var outIndex=0;
      var highByte=( s===0 ? 1 : 0);

      var inIndex=header.getInt32( (s+1)*4,true);
      var maxIndex=header.getInt32( (s+2)*4,true);
      if( maxIndex===0 )
        maxIndex = frameData.length;

      while( inIndex < maxIndex ) {
        var n=data.getInt8(inIndex++);
        if( n >=0 && n <=127 ) {
          for( var i=0 ; i < n+1 && outIndex < frameSize ; ++i ) {
            out.setInt8( (outIndex*2)+highByte, data.getInt8(inIndex++) );
            outIndex++;
          }
        } else if( n<= -1 && n>=-127 ) {
          var value=data.getInt8(inIndex++);
          for( var j=0 ; j < -n+1 && outIndex < frameSize ; ++j ) {
            out.setInt8( (outIndex*2)+highByte, value );
            outIndex++;
          }
        } else if (n===-128)
          ; // do nothing
      }
    }
    if(imageFrame.pixelRepresentation === 0) {
      imageFrame.pixelData = new Uint16Array(outFrame);
    } else {
      imageFrame.pixelData = new Int16Array(outFrame);
    }
    return imageFrame;
  }

  // module exports
  cornerstoneWADOImageLoader.decodeRLE = decodeRLE;

}(cornerstoneWADOImageLoader));
(function (cornerstoneWADOImageLoader) {

  "use strict";

  function getMinMax(storedPixelData)
  {
    // we always calculate the min max values since they are not always
    // present in DICOM and we don't want to trust them anyway as cornerstone
    // depends on us providing reliable values for these
    var min = storedPixelData[0];
    var max = storedPixelData[0];
    var storedPixel;
    var numPixels = storedPixelData.length;
    for(var index = 1; index < numPixels; index++) {
      storedPixel = storedPixelData[index];
      min = Math.min(min, storedPixel);
      max = Math.max(max, storedPixel);
    }

    return {
      min: min,
      max: max
    };
  }

  // module exports
  cornerstoneWADOImageLoader.getMinMax = getMinMax;

}(cornerstoneWADOImageLoader));

