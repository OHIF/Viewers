import React, { Component } from 'react';
import * as dcmjs from 'dcmjs';
import TypedArrayProp from './TypedArrayProp';

const { DicomMetaDictionary, DicomMessage } = dcmjs.data;

function getMainData(dataset) {
  const root = [];
  const {
    CompletionFlag,
    VerificationFlag,
    Manufacturer,
    ContentDateTime
  } = dataset;

  if (CompletionFlag) {
    root.push(getMainDataItem('Completion flag', CompletionFlag));
  }

  if (VerificationFlag) {
    root.push(getMainDataItem('Verification flag', VerificationFlag));
  }

  if (Manufacturer) {
    root.push(getMainDataItem('Manufacturer', Manufacturer));
  }

  if (ContentDateTime) {
    root.push(getMainDataItem('Content Date/Time', ContentDateTime));
  }

  return <div>{root}</div>;
}

const getContentSequence = (data, level = 1) => {
  let header;

  if (data.ConceptNameCodeSequence) {
    const {
      CodeMeaning,
      CodeValue,
      CodingSchemeDesignator
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
    error: null
  };

  static propTypes = {
    byteArray: TypedArrayProp.uint8
  };

  componentDidMount() {
    const dataSet = this.setContentFromByteArray(this.props.byteArray);
  }

  setContentFromByteArray(byteArray) {
    const arrayBuffer = byteArray.buffer;
    const dicomData = DicomMessage.readFile(arrayBuffer);
    const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
    dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

    // TODO: not sure why this stuff was separated from the rest...
    const mainData = getMainData(dataset);
    const contentSequence = getContentSequence(dataset.ContentSequence);

    debugger;
    const content = (
      <>
        {mainData}
        {contentSequence}
      </>
    );

    this.setState({
      content
    });
  }

  render() {
    const style = { width: '100%', height: '100%', 'overflow-y': 'scroll' };
    return (
      <div className={'DicomHtmlViewport'} style={style}>
        {this.state.content}
        {this.state.error && <h2>{JSON.stringify(this.state.error)}</h2>}
      </div>
    );
  }
}

export default DicomHtmlViewport;
