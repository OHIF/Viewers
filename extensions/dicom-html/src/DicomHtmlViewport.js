import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dcmjs from 'dcmjs';
import TypedArrayProp from './TypedArrayProp';

import './DicomHtmlViewport.css';

function getRelationshipString(data) {
  switch (data.RelationshipType) {
    case 'HAS CONCEPT MOD':
      return 'Concept modifier: ';
    case 'HAS OBS CONTEXT':
      return 'Observation context: ';
    default:
      return '';
  }
}

const getMeaningString = data => {
  if (data.ConceptNameCodeSequence) {
    const { CodeMeaning } = data.ConceptNameCodeSequence;

    return `${CodeMeaning} = `;
  }

  return '';
};

function getValueString(data) {
  switch (data.ValueType) {
    case 'CODE':
      const {
        CodeMeaning,
        CodeValue,
        CodingSchemeDesignator,
      } = data.ConceptNameCodeSequence;

      return `${CodeMeaning} (${CodeValue}, ${CodingSchemeDesignator})`;

    case 'PNAME':
      return data.PersonName;

    case 'TEXT':
      return data.TextValue;

    case 'UIDREF':
      return data.UID;

    case 'NUM':
      const { MeasuredValueSequence } = data;
      const numValue = MeasuredValueSequence.NumericValue;
      const codeValue =
        MeasuredValueSequence.MeasurementUnitsCodeSequence.CodeValue;
      return `${numValue} ${codeValue}`;
  }
}

function constructPlainValue(data) {
  const value = getValueString(data);

  if (value) {
    return getRelationshipString(data) + getMeaningString(data) + value;
  }
}

function constructContentSequence(data, header) {
  if (!data.ContentSequence) {
    return;
  }

  const items = data.ContentSequence.map(item => parseContent(item)).filter(
    item => item
  );

  if (!items.length) {
    return;
  }

  const result = {
    items,
  };

  if (header) {
    result.header = header;
  }

  return result;
}

function parseContent(data) {
  if (data.ValueType) {
    if (data.ValueType === 'CONTAINER') {
      const header = data.ConceptNameCodeSequence.CodeMeaning;

      return constructContentSequence(data, header);
    }

    return constructPlainValue(data);
  }

  if (data.ContentSequence) {
    return constructContentSequence(data);
  }
}

const { DicomMetaDictionary, DicomMessage } = dcmjs.data;

function getMainData(data) {
  const root = [];

  const patientValue = `${data.PatientName} (${data.PatientSex}, #${data.PatientID})`;
  root.push(getMainDataItem('Patient', patientValue));

  const studyValue = data.StudyDescription;
  root.push(getMainDataItem('Study', studyValue));

  const seriesValue = `${data.SeriesDescription} (#${data.SeriesNumber})`;
  root.push(getMainDataItem('Series', seriesValue));

  const manufacturerValue = `${data.Manufacturer} (${data.ManufacturerModelName}, #${data.DeviceSerialNumber})`;

  root.push(getMainDataItem('Manufacturer', manufacturerValue));

  const mainDataObjects = {
    CompletionFlag: 'Completion flag',
    VerificationFlag: 'Verification flag',
  };

  Object.keys(mainDataObjects).forEach(key => {
    if (!data[key]) {
      return;
    }

    const item = getMainDataItem(mainDataObjects[key], data[key]);

    root.push(item);
  });

  // TODO: Format these dates
  const contentDateTimeValue = `${data.ContentDate} ${data.ContentTime}`;
  root.push(getMainDataItem('Content Date/Time', contentDateTimeValue));

  root.push();

  return <div>{root}</div>;
}

const getContentSequence = (data, level = 1) => {
  let header;

  if (data.ConceptNameCodeSequence) {
    const {
      CodeMeaning,
      CodeValue,
      CodingSchemeDesignator,
    } = data.ConceptNameCodeSequence;

    header = `${CodeMeaning} (${CodeValue} - ${CodingSchemeDesignator})`;
  }

  const root = [];
  if (header) {
    const HeaderDynamicLevel = `h${level}`;

    root.push(<HeaderDynamicLevel key={header}>{header}</HeaderDynamicLevel>);
  }

  Object.keys(data).forEach(key => {
    const value = data[key];

    let content;
    if (value instanceof Object) {
      content = getContentSequence(value, level + 1);
    } else {
      content = (
        <div key={key}>
          {key} - {data[key]}
        </div>
      );
    }

    root.push(content);
  });

  return <div>{root}</div>;
};

function getMainDataItem(key, value) {
  return (
    <div key={key}>
      <b>{key}</b>: {value}
    </div>
  );
}

class DicomHtmlViewport extends Component {
  state = {
    content: null,
    error: null,
  };

  static propTypes = {
    byteArray: TypedArrayProp.uint8,
    setViewportActive: PropTypes.func.isRequired,
    viewportIndex: PropTypes.number.isRequired,
    activeViewportIndex: PropTypes.number.isRequired,
  };

  componentDidMount() {
    const dataSet = this.setContentFromByteArray(this.props.byteArray);
  }

  setContentFromByteArray(byteArray) {
    const arrayBuffer = byteArray.buffer;
    const dicomData = DicomMessage.readFile(arrayBuffer);
    const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
    dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

    const mainData = getMainData(dataset);
    const contentSequence = getContentSequence(dataset);
    const content = (
      <>
        {mainData}
        {contentSequence}
      </>
    );

    this.setState({
      content,
    });
  }

  setViewportActiveHandler = () => {
    const {
      setViewportActive,
      viewportIndex,
      activeViewportIndex,
    } = this.props;

    if (viewportIndex !== activeViewportIndex) {
      setViewportActive(viewportIndex);
    }
  };

  render() {
    const { content, error } = this.state;

    return (
      <div
        data-cy="dicom-html-viewport"
        className="DicomHtmlViewport"
        onClick={this.setViewportActiveHandler}
        onScroll={this.setViewportActiveHandler}
      >
        {content}
        {error && <h2>{JSON.stringify(error)}</h2>}
      </div>
    );
  }
}

export default DicomHtmlViewport;
