import React, { useEffect } from 'react';
import cornerstone from 'cornerstone-core';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';

const LayerControls = () => {
  const [opacity, setOpacity] = React.useState(0.5);
  const [sync, setSync] = React.useState(false);
  const [colorMap, setColorMap] = React.useState('hotIron');
  const [element, setElement] = React.useState({});
  const [enabledElement, setEnabledElement] = React.useState({});
  const [layers, setLayers] = React.useState([]);
  const [acLayer, setAcLayer] = React.useState('');
  const colors = cornerstone.colors.getColormapsList();

  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }

    // retrieving cornerstone enable element object
    const enabled_element = cornerstone.getEnabledElement(element);
    if (!enabled_element || !enabled_element.image) {
      return;
    }

    // retriveing all current layers
    const allLayers = cornerstone.getLayers(element);

    if (allLayers.length <= 0) {
      createBaseLayerControl(element, enabled_element.image.imageId);
    }

    setTimeout(() => {
      // getting active layer for modification
      const layer = cornerstone.getActiveLayer(element);

      if (!layer) return;

      // updating all state variables to their new values
      setSync(enabledElement.syncViewports);
      setAcLayer(layer.layerId);
      setLayers([...allLayers]);
      setElement(viewports.element);
      setEnabledElement(viewports);
    }, 700);
  }, []);

  const createBaseLayerControl = (element, image_id) => {
    cornerstone.loadImage(image_id).then(image => {
      // adding layer for the first stack of images
      const layer_id = cornerstone.addLayer(element, image);

      // Setting the new image layer as the active layer
      cornerstone.setActiveLayer(element, layer_id);

      // update the current image on the viewport with the new image
      cornerstone.updateImage(element);
    });
  };

  const onHandleOpacuty = event => {
    setOpacity(event.target.value);

    // getting active layer for modification
    const layer = cornerstone.getActiveLayer(element);

    // setting prefered opacity for active layer
    layer.options.opacity = event.target.value;

    // update the element to apply new settings
    cornerstone.updateImage(element);
  };

  const onHandleSync = () => {
    setSync(!sync);

    // toggling between syncing viewports
    enabledElement.syncViewports = !sync;

    setEnabledElement(enabledElement);

    // update the element to apply new settings
    cornerstone.updateImage(element);
  };

  const onHandleColorChange = event => {
    setColorMap(event.target.value);

    // getting the active layer for the viewport for modification
    const layer = cornerstone.getActiveLayer(element);

    // setting colormap to selected color
    layer.viewport.colormap = event.target.value;

    // update the element to apply new settings
    cornerstone.updateImage(element);
  };

  const onHandleLayerChange = event => {
    setAcLayer(event.target.value);

    // setting active layer with the selected layer
    cornerstone.setActiveLayer(element, event.target.value);

    // update the element to apply new settings
    cornerstone.updateImage(element);
  };

  return (
    <div className="component">
      <div className="title-header">Layer Controls</div>

      <h4>Opacity Settings</h4>
      <form>
        <label>
          <input
            id="imageOpacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={onHandleOpacuty}
          />
        </label>

        {layers.length > 1 && (
          <div>
            <h4>Sync Viewports</h4>
            <label>
              <input
                id="syncViewports"
                type="checkbox"
                checked={sync}
                onChange={onHandleSync}
                className="syncButton"
              />
            </label>
          </div>
        )}

        <h4>Color Maps</h4>
        <label>
          <select
            id="colormaps"
            className="select-container"
            onChange={onHandleColorChange}
            value={colorMap}
          >
            {colors.map((color, index) => (
              <option key={index} value={color.id}>
                {color.name}
              </option>
            ))}
          </select>
        </label>

        {layers.length > 0 && (
          <div>
            <h4>Select Active Layer</h4>
            <label>
              <select
                id="layers"
                className="select-container"
                onChange={onHandleLayerChange}
                value={acLayer}
              >
                {layers.map((layer, index) => (
                  <option key={index} value={layer.layerId}>
                    Layer {index + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </form>
    </div>
  );
};

export default LayerControls;
