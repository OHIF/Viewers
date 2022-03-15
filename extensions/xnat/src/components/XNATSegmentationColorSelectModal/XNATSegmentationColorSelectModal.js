import React, { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import XNATColorMapSelect from './XNATColorMapSelect';
import XNATColorMapSelectItem from './XNATColorMapSelectItem';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import './XNATSegmentationColorSelectModal.css';
import colorMaps from '../../constants/colorMaps';

const refreshViewports = () => {
  cornerstoneTools.store.state.enabledElements.forEach(element =>
    cornerstone.updateImage(element)
  );
};

function ColorPicker({ defaultColor = '#fff', onChangeComplete }) {
  const [currentColor, setCurrentColor] = useState(defaultColor);

  useEffect(() => {
    setCurrentColor(defaultColor);
  }, [defaultColor]);

  return (
    <ChromePicker
      color={currentColor}
      onChangeComplete={onChangeComplete}
      onChange={setCurrentColor}
      disableAlpha={true}
    />
  );
}

const segmentationModule = cornerstoneTools.getModule('segmentation');
const { state } = segmentationModule;

export default function XNATSegmentationSelectColorModal({
  labelmap3D,
  segmentIndex,
  onColorChangeCallback,
}) {
  const [colorLUT, setColorLUT] = useState(null);
  const [isColorMap, setIsColorMap] = useState(false);
  const [singleColor, setSingleColor] = useState(undefined);
  const [selectedColorMapID, setSelectedColorMapID] = useState(null);

  const onSingleColorChangeComplete = color => {
    const { rgb } = color;
    const colorArray = [rgb.r, rgb.g, rgb.b, 255];
    colorLUT[segmentIndex] = colorArray;

    if (labelmap3D.isFractional) {
      segmentationModule.configuration.fillAlpha = 1.0;
      segmentationModule.configuration.renderOutline = true;
    }

    onColorChangeCallback(colorArray);
    setIsColorMap(false);
    setSelectedColorMapID(null);
    setSingleColor(rgb);
    refreshViewports();
  };

  const colorMapList = colorMaps.map(cm => {
    const { title, description, colormap, ID } = cm;

    return {
      value: ID,
      title,
      description,
      onClick: () => {
        colorLUT[segmentIndex] = colormap;
        colorLUT[segmentIndex].ID = ID;

        if (segmentationModule.configuration.fillAlpha === 1) {
          segmentationModule.configuration.fillAlpha = 0.5;
        }

        segmentationModule.configuration.renderOutline = false;

        const highestColorArray = colormap[colormap.length - 1];

        onColorChangeCallback(highestColorArray);
        setSelectedColorMapID(ID);
        setIsColorMap(true);
        refreshViewports();
      },
    };
  });

  useEffect(() => {
    const { colorLUTIndex } = labelmap3D;
    const activeColorLUT = state.colorLutTables[colorLUTIndex];

    const colorOrColormap = activeColorLUT[segmentIndex];

    const isColorMap = Array.isArray(colorOrColormap[0]);

    let defaultColor;
    let defaultSelectedColorMapID;

    if (isColorMap) {
      defaultSelectedColorMapID = colorOrColormap.ID;
    } else {
      defaultColor = {
        r: colorOrColormap[0],
        g: colorOrColormap[1],
        b: colorOrColormap[2],
      };
    }

    setColorLUT(activeColorLUT);
    setIsColorMap(isColorMap);
    setSingleColor(defaultColor);
    setSelectedColorMapID(defaultSelectedColorMapID);
  }, []);

  const defaultColorMapValue = selectedColorMapID
    ? colorMapList.find(cm => cm.value === selectedColorMapID)
    : null;

  const selectedText = isColorMap
    ? `ColorMap: ${defaultColorMapValue.title}`
    : singleColor
    ? `[${singleColor.r.toFixed(0)}, ${singleColor.g.toFixed(
        0
      )}, ${singleColor.b.toFixed(0)}]`
    : null;

  return (
    <div className="xnat-color-select-container">
      <div className="xnat-colormap-item">
        <h2 className="xnat-color-select-header">Selected</h2>
        <h4>{selectedText}</h4>
      </div>
      <div className="xnat-colormap-item">
        <ColorPicker
          className="xnat-color-select"
          className="color-picker"
          defaultColor={singleColor}
          onChangeComplete={onSingleColorChangeComplete}
        />
      </div>

      {labelmap3D.isFractional ? (
        <div className="xnat-colormap-item">
          <XNATColorMapSelect
            value={defaultColorMapValue}
            formatOptionLabel={XNATColorMapSelectItem}
            options={colorMapList}
          />
        </div>
      ) : null}
    </div>
  );
}
