import * as cornerstone from '@cornerstonejs/core'
import * as csTools from '@cornerstonejs/tools';

// Replace the importInternal with our own conversion function
const convertToVector3 = (inputArray) => {
  if (inputArray && inputArray.length === 3) {
    return {
      x: inputArray[0],
      y: inputArray[1],
      z: inputArray[2]
    };
  }
  return {
    x: 0,
    y: 0,
    z: 0
  };
};

const { getToolState } = csTools;

/**
 * Return an array filtered to only its unique members
 *
 * @private
 * @param {Array} array - The array to filter
 * @returns {Array}
 */
function unique(array) {
  return array.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

/**
 * Synchronize target and source elements when an event fires on the source element
 * @export @public constructor
 * @name Synchronizer
 *
 * @param {String} event - The event(s) that will trigger synchronization. Separate multiple events by a space
 * @param {Function} handler - The function that will make the necessary changes to the target element in order to synchronize it with the source element
 * @returns {void}
 */
function Synchronizer(event, handler) {
  const that = this;
  const sourceElements = []; // Source elements fire the events we want to synchronize to
  const targetElements = []; // Target elements we want to synchronize to source elements

  let ignoreFiredEvents = false;
  const initialData = {};
  let eventHandler = handler;

  this.enabled = true;

  /**
   * Update the event handler to perform synchronization
   * @param {Function} handler - The event handler function
   * @returns {void}
   */
  this.setHandler = function(handler) {
    eventHandler = handler;
  };

  /**
   * Return a reference to the event handler function
   * @returns {Function}
   */
  this.getHandler = function() {
    return eventHandler;
  };

  /**
   * Calculate the initial distances between the source image and each
   * of the target images
   * @returns {void}
   */
  this.getDistances = function() {
    if (!sourceElements.length || !targetElements.length) {
      return;
    }

    initialData.distances = {};
    initialData.imageIds = {
      sourceElements: [],
      targetElements: [],
    };

    sourceElements.forEach(function(sourceElement) {
      const sourceEnabledElement = cornerstone.getEnabledElement(sourceElement);

      if (!sourceEnabledElement || !sourceEnabledElement.image) {
        return;
      }

      const sourceImageId = sourceEnabledElement.image.imageId;
      const sourceImagePlane = cornerstone.metaData.get(
        'imagePlaneModule',
        sourceImageId
      );

      if (!sourceImagePlane || !sourceImagePlane.imagePositionPatient) {
        return;
      }

      const sourceImagePosition = convertToVector3(
        sourceImagePlane.imagePositionPatient
      );

      if (initialData.hasOwnProperty(sourceEnabledElement)) {
        return;
      }
      initialData.distances[sourceImageId] = {};

      initialData.imageIds.sourceElements.push(sourceImageId);

      targetElements.forEach(function(targetElement) {
        const targetEnabledElement = cornerstone.getEnabledElement(
          targetElement
        );

        if (!targetEnabledElement || !targetEnabledElement.image) {
          return;
        }

        const targetImageId = targetEnabledElement.image.imageId;

        initialData.imageIds.targetElements.push(targetImageId);

        if (sourceElement === targetElement) {
          return;
        }

        if (sourceImageId === targetImageId) {
          return;
        }

        if (
          initialData.distances[sourceImageId].hasOwnProperty(targetImageId)
        ) {
          return;
        }

        const targetImagePlane = cornerstone.metaData.get(
          'imagePlaneModule',
          targetImageId
        );

        if (!targetImagePlane || !targetImagePlane.imagePositionPatient) {
          return;
        }

        const targetImagePosition = convertToVector3(
          targetImagePlane.imagePositionPatient
        );

        initialData.distances[sourceImageId][
          targetImageId
        ] = targetImagePosition.clone().sub(sourceImagePosition);
      });

      if (!Object.keys(initialData.distances[sourceImageId]).length) {
        delete initialData.distances[sourceImageId];
      }
    });
  };

  /**
   * Gather necessary event data and call synchronization handler
   *
   * @private
   * @param {HTMLElement} sourceElement - The source element for the event
   * @param {Object} eventData - The data object for the source event
   * @returns {void}
   */
  this.fireEvent = function(sourceElement, eventData) {
    const isDisabled = !that.enabled;
    const noElements = !sourceElements.length || !targetElements.length;

    if (isDisabled || noElements) {
      return;
    }

    ignoreFiredEvents = true;
    targetElements.forEach(function(targetElement) {
      const targetIndex = targetElements.indexOf(targetElement);

      if (targetIndex === -1) {
        return;
      }

      const targetImageId = initialData.imageIds.targetElements[targetIndex];
      const sourceIndex = sourceElements.indexOf(sourceElement);

      if (sourceIndex === -1) {
        return;
      }

      const sourceImageId = initialData.imageIds.sourceElements[sourceIndex];

      let positionDifference;

      if (sourceImageId === targetImageId) {
        positionDifference = 0;
      } else if (initialData.distances[sourceImageId] !== undefined) {
        positionDifference =
          initialData.distances[sourceImageId][targetImageId];
      }

      eventHandler(
        that,
        sourceElement,
        targetElement,
        eventData,
        positionDifference
      );
    });
    ignoreFiredEvents = false;
  };

  /**
   * Call fireEvent if not ignoring events, and pass along event data
   *
   * @private
   * @param {Event} e - The source event object
   * @returns {void}
   */
  this.onEvent = function(e) {
    const eventData = e.detail;

    if (ignoreFiredEvents === true) {
      return;
    }

    that.fireEvent(e.currentTarget, eventData);
  };

  /**
   * Add a source element to this synchronizer
   *
   * @param {HTMLElement} element - The new source element
   * @returns {void}
   */
  this.addSource = function(element) {
    // Return if this element was previously added
    const index = sourceElements.indexOf(element);

    if (index !== -1) {
      return;
    }

    // Add to our list of enabled elements
    sourceElements.push(element);

    // Subscribe to the event
    event.split(' ').forEach(oneEvent => {
      element.addEventListener(oneEvent, that.onEvent);
    });

    // Update the initial distances between elements
    that.getDistances();

    that.updateDisableHandlers();
  };

  /**
   * Add a target element to this synchronizer
   *
   * @param {HTMLElement} element - The new target element to be synchronized
   * @returns {void}
   */
  this.addTarget = function(element) {
    // Return if this element was previously added
    const index = targetElements.indexOf(element);

    if (index !== -1) {
      return;
    }

    // Add to our list of enabled elements
    targetElements.push(element);

    // Update the initial distances between elements
    that.getDistances();

    // Invoke the handler for this new target element
    eventHandler(that, element, element, 0);

    that.updateDisableHandlers();
  };

  /**
   * Add an element to this synchronizer as both a source and a target
   *
   * @param {HTMLElement} element - The new element
   * @returns {void}
   */
  this.add = function(element) {
    that.addSource(element);
    that.addTarget(element);
  };

  /**
   * Remove a source element from this synchronizer
   *
   * @param {HTMLElement} element - The element to be removed
   * @returns {void}
   */
  this.removeSource = function(element) {
    // Find the index of this element
    const index = sourceElements.indexOf(element);

    if (index === -1) {
      return;
    }

    // Remove this element from the array
    sourceElements.splice(index, 1);

    // Stop listening for the event
    event.split(' ').forEach(oneEvent => {
      element.removeEventListener(oneEvent, that.onEvent);
    });

    // Update the initial distances between elements
    that.getDistances();

    // Update everyone listening for events
    that.fireEvent(element);
    that.updateDisableHandlers();
  };

  /**
   * Remove a target element from this synchronizer
   *
   * @param {HTMLElement} element - The element to be removed
   * @returns {void}
   */
  this.removeTarget = function(element) {
    // Find the index of this element
    const index = targetElements.indexOf(element);

    if (index === -1) {
      return;
    }

    // Remove this element from the array
    targetElements.splice(index, 1);

    // Update the initial distances between elements
    that.getDistances();

    // Invoke the handler for the removed target
    eventHandler(that, element, element, 0);
    that.updateDisableHandlers();
  };

  /**
   * Remove an element from this synchronizer as both a target and source
   *
   * @param {HTMLElement} element - The element to be removed
   * @returns {void}
   */
  this.remove = function(element) {
    that.removeTarget(element);
    that.removeSource(element);
  };

  /**
   * Get the array of source elements
   *
   * @returns {HTMLElement[]}
   */
  this.getSourceElements = function() {
    return sourceElements;
  };

  /**
   * Get the array of target elements
   *
   * @returns {HTMLElement[]}
   */
  this.getTargetElements = function() {
    return targetElements;
  };

  /**
   * Display an image while halting synchronization
   *
   * @param {HTMLElement} element - The element containing the image
   * @param {Object} image - The cornerstone image object
   * @param {Object} viewport - The cornerstone viewport object
   * @returns {void}
   */
  this.displayImage = function(element, image, viewport) {
    ignoreFiredEvents = true;

    const toolData = getToolState(element, 'stack');

    if (toolData && toolData.data && toolData.data.length > 1) {
      const stackRendererData = getToolState(element, 'stackRenderer');
      if (
        stackRendererData &&
        stackRendererData.data &&
        stackRendererData.data.length
      ) {
        const stackRenderer = stackRendererData.data[0];
        const stackData = toolData.data[0];
        stackRenderer.currentImageIdIndex = stackData.currentImageIdIndex;
        stackRenderer.render(element, toolData.data);
      }
    } else {
      cornerstone.displayImage(element, image, viewport);
    }

    ignoreFiredEvents = false;
  };

  /**
   * Update a viewport while halting synchronization
   *
   * @param {HTMLElement} element - The target element
   * @param {Object} viewport - The new cornerstone viewport object
   * @returns {void}
   */
  this.setViewport = function(element, viewport) {
    ignoreFiredEvents = true;
    cornerstone.setViewport(element, viewport);
    ignoreFiredEvents = false;
  };

  /**
   * Remove an element from the synchronizer based on an event from that element
   *
   * @private
   * @param {Event} e - The event whose element will be removed
   * @returns {void}
   */
  function disableHandler(e) {
    const element = e.detail.element;

    that.remove(element);
    // clearToolOptionsByElement(element);
  }

  /**
   * Add an event listener to each element that can remove it from the synchronizer
   * @returns {void}
   */
  this.updateDisableHandlers = function() {
    const elements = unique(sourceElements.concat(targetElements));

    elements.forEach(function(element) {
      element.removeEventListener(
        cornerstone.EVENTS.ELEMENT_DISABLED,
        disableHandler
      );
      element.addEventListener(
        cornerstone.EVENTS.ELEMENT_DISABLED,
        disableHandler
      );
    });
  };

  /**
   * Remove all elements from this synchronizer
   *  @returns {void}
   */
  this.destroy = function() {
    const elements = unique(sourceElements.concat(targetElements));

    elements.forEach(function(element) {
      that.remove(element);
    });
  };
}

export default Synchronizer;
