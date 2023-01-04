import React, { useEffect, useContext, useRef } from 'react';
import cornerstone from 'cornerstone-core';
import '../AITriggerComponent.css';
import { getEnabledElement } from '../../../../../../extensions/cornerstone/src/state';
import { JobsContext } from '../../../context/JobsContext';
import classNames from 'classnames';

const LayerControls = () => {
  const [opacity, setOpacity] = React.useState(0.5);
  const [sync, setSync] = React.useState(false);
  const [colorMap, setColorMap] = React.useState('spectral');
  const [element, setElement] = React.useState({});
  const [enabledElement, setEnabledElement] = React.useState({});
  const [layers, setLayers] = React.useState([]);
  const [acLayer, setAcLayer] = React.useState('');
  const colors = cornerstone.colors.getColormapsList();
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const { opacityStatus, setOpacityStatus } = useContext(JobsContext);
  const { colorMapStatus, setColorMapStatus } = useContext(JobsContext);
  const [activeTab, setActiveTab] = React.useState(true);

  useEffect(() => {
    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // console.log({ viewports, view_ports });

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
      setSync(enabled_element.syncViewports);
      setAcLayer(layer.layerId);
      setLayers([...allLayers]);
      setElement(viewports.element);
      setEnabledElement(viewports);
    }, 700);
  }, []);

  // function for creating a base layer if non exists
  const createBaseLayerControl = (element, image_id) => {
    cornerstone.loadAndCacheImage(image_id).then(image => {
      // adding layer for the first stack of images
      const layer_id = cornerstone.addLayer(element, image);

      // Setting the new image layer as the active layer
      cornerstone.setActiveLayer(element, layer_id);

      // update the current image on the viewport with the new image
      cornerstone.updateImage(element);
    });
  };

  // function for changing opacity of active layer
  const onHandleOpacuty = event => {
    setOpacity(event.target.value);
    const all_layers = cornerstone.getLayers(element);
    if (all_layers.length > 1) {
      const layer = cornerstone.getLayer(element, all_layers[1].layerId);

      // setting prefered opacity for active layer
      layer.options.opacity = event.target.value;

      setOpacityStatus(event.target.value);

      // update the element to apply new settings
      cornerstone.updateImage(element);
    }
  };

  // function for changing the colormap for an active layer
  const onHandleColorChange = event => {
    // console.log(event.target.value);
    setColorMap(event.target.value);

    // getting all active layers in the current element
    const all_layers = cornerstone.getLayers(element);

    if (all_layers.length > 1) {
      const layer = cornerstone.getLayer(element, all_layers[1].layerId);

      // setting colormap to selected color
      layer.viewport.colormap = event.target.value;

      setColorMapStatus(event.target.value);

      // update the element to apply new settings
      cornerstone.updateImage(element);
    }
  };

  return (
    <div className="component">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-around',
          // flexWrap: 'wrap',
        }}
      >
        <div
          className={classNames('btn', {
            'btn-primary': true,
          })}
          onClick={() => setActiveTab(!activeTab)}
        >
          {activeTab ? ' Hide Layout Parameter' : ' Show Layout Parameter'}
        </div>
      </div>

      {activeTab && (
        <>
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
                disabled={overlayStatus === true ? false : true}
              />
            </label>

            <h4>Color Maps</h4>
            <label>
              <select
                id="colormaps"
                className="select-container"
                onChange={onHandleColorChange}
                value={colorMap}
                disabled={overlayStatus === true ? false : true}
              >
                {colors.map((color, index) => (
                  <option key={index} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </>
      )}
    </div>
  );
};

export default LayerControls;
