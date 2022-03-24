import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import { Range, SelectTree } from '@ohif/ui';

import '../XNATRoiPanel.styl';

const segmentationModule = cornerstoneTools.getModule('segmentation');
const { configuration } = segmentationModule;
const minGateSeparation = 1;
const maxGateSeparation = 100;

/**
 * @class SmartAndAutoBrushSettings - A component that allows the user to change
 * configuration of the Brush tools.
 */
export default class SmartAndAutoBrushSettings extends React.Component {
  constructor(props = {}) {
    super(props);

    const customGateRange = segmentationModule.getters.customGateRange();

    this.state = {
      holeFill: configuration.holeFill,
      strayRemove: configuration.strayRemove,
      activeGate: configuration.activeGate,
      customGateRangeMin: customGateRange[0],
      customGateRangeMax: customGateRange[1],
      customGateSeparation: configuration.customGateSeparation,
    };

    this.onGateChange = this.onGateChange.bind(this);
    this.onCustomGateMinChange = this.onCustomGateMinChange.bind(this);
    this.onCustomGateMaxChange = this.onCustomGateMaxChange.bind(this);
    this.onHoleFillChange = this.onHoleFillChange.bind(this);
    this.onStrayRemoveChange = this.onStrayRemoveChange.bind(this);
    this.onCustomGateSeparationChange = this.onCustomGateSeparationChange.bind(this);
  }

  /**
   * onGateChange - Callback that changes the active gate of the Smart CT Brush.
   *
   * @param  {type} evt description
   * @returns {type}     description
   */
  onGateChange(evt) {
    const val = evt.target.value;

    this.saveGateSettings('activeGate', val);

    this.setState({ activeGate: val });
    configuration.activeGate = val;
  }

  /**
   * onCustomGateMinChange - Changes the minimum value of a
   * custom Smart CT Gate.
   *
   * @param  {object} evt The event.
   * @returns {null}
   */
  onCustomGateMinChange(evt) {
    let val = Number(evt.target.value);

    const { customGateRangeMax, customGateSeparation } = this.state;

    if (val > customGateRangeMax - customGateSeparation) {
      val = customGateRangeMax - customGateSeparation;
      evt.target.value = val;
    }

    this.saveGateSettings('customGate.range[0]', val);

    this.setState({ customGateRangeMin: val });
    segmentationModule.setters.customGateRange(val, null);
  }

  /**
   * onCustomGateMaxChange - Changes the maximum value of a
   * custom Smart CT Gate.
   *
   * @param  {object} evt The event.
   * @returns {null}
   */
  onCustomGateMaxChange(evt) {
    let val = Number(evt.target.value);

    const { customGateRangeMin, customGateSeparation } = this.state;

    if (val < customGateRangeMin + customGateSeparation) {
      val = customGateRangeMin + customGateSeparation;
      evt.target.value = val;
    }

    this.saveGateSettings('customGate.range[1]', val);

    this.setState({ customGateRangeMax: val });
    segmentationModule.setters.customGateRange(null, val);
  }

  onCustomGateSeparationChange(evt) {
    let val = Number(evt.target.value);

    if (val < minGateSeparation) {
      val = minGateSeparation;
    } else if (val > maxGateSeparation) {
      val = maxGateSeparation;
    }

    this.saveGateSettings('customGate.separation', val);
    this.setState({ customGateSeparation: val });
  }

  saveGateSettings(field, value) {
    const {
      activeGate,
      customGateRangeMin,
      customGateRangeMax,
      customGateSeparation,
    } = this.state;

    const gateSettings = {
      customGate: {
        range: [customGateRangeMin, customGateRangeMax],
        separation: customGateSeparation,
      },
      activeGate: activeGate,
    };

    _.set(gateSettings, field, value);

    localStorage.setItem('xnat-gate-settings', JSON.stringify(gateSettings));
  }

  /**
   * onHoleFillChange - Changes the value of the hole fill parameter for the
   * Smart CT and Auto brushes.
   *
   * @param  {object} evt The event.
   * @returns {null}
   */
  onHoleFillChange(evt) {
    const val = Number(evt.target.value);

    this.setState({ holeFill: val });
    configuration.holeFill = val;
  }

  /**
   * onStrayRemoveChange - Changes the balue of the stray remove parameter for
   * the Smart CT and Auto brushes.
   *
   * @param  {object} evt The event.
   * @returns {null}
   */
  onStrayRemoveChange(evt) {
    const val = Number(evt.target.value);

    this.setState({ strayRemove: val });
    configuration.strayRemove = val;
  }

  render() {
    const holeFillRange = configuration.holeFillRange;
    const strayRemoveRange = configuration.strayRemoveRange;

    const {
      holeFill,
      strayRemove,
      activeGate,
      customGateSeparation,
    } = this.state;

    const gates = configuration.gates;

    const holeFillLabel =
      holeFill === 0
        ? "Don't fill holes."
        : `Fill holes <${holeFill}% area of primary region.`;

    const strayRemoveLabel =
      strayRemove === 0
        ? 'Paint all non-primary regions.'
        : `Don't paint regions <${strayRemove}% area of primary region.`;

    let customGates = null;

    if (activeGate === 'custom') {
      const customRange = segmentationModule.getters.customGateRange();

      customGates = (
        <div>
          <div className="footerSectionItem">
            <label htmlFor="gateSeparation">Gate Separation:</label>
            <input
              id="gateSeparation"
              type="number"
              className="preferencesInput"
              min={minGateSeparation}
              max={maxGateSeparation}
              step={1}
              value={customGateSeparation}
              onChange={this.onCustomGateSeparationChange}
            />
          </div>
          <div className="footerSectionItem" style={{ margin: '10px 5px' }}>
            <label htmlFor="customGateMin">Min:</label>
            <Range
              id="customGateMin"
              min={-1024}
              max={3072}
              defaultValue={customRange[0]}
              onChange={this.onCustomGateMinChange}
            />
          </div>
          <div className="footerSectionItem">
            <label htmlFor="customGateMax">Max:</label>
            <Range
              id="customGateMax"
              min={-1024}
              max={3072}
              defaultValue={customRange[1]}
              onChange={this.onCustomGateMaxChange}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="roiPanelFooter">
        <div className="footerSection">
          <h5> Smart CT Gate Selection</h5>
          <div className="footerSectionItem">
            <select
              // className="form-themed form-control"
              onChange={this.onGateChange}
              value={activeGate}
            >
              {gates.map(gate => (
                <option key={gate.name} value={gate.name}>{`${gate.name} [${
                  gate.range[0]
                }, ${gate.range[1]}]`}</option>
              ))}
            </select>
          </div>
          {customGates}
        </div>

        <div className="footerSection">
          <h5> Smart/Auto Gate Settings </h5>
          <div className="footerSectionItem" style={{ flexDirection: 'column' }}>
            <p>{holeFillLabel}</p>
            <Range
              name="holeFill"
              min={holeFillRange[0]}
              max={holeFillRange[1]}
              value={holeFill}
              onChange={this.onHoleFillChange}
            />
          </div>
          <div
            className="footerSectionItem"
            style={{ flexDirection: 'column' }}
          >
            <p>{strayRemoveLabel}</p>
            <Range
              min={strayRemoveRange[0]}
              value={strayRemove}
              max={strayRemoveRange[1]}
              onChange={this.onStrayRemoveChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
