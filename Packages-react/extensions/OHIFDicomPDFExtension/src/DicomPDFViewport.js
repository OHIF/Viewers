import React, { Component } from 'react';
import dicomParser from 'dicom-parser';
import TypedArrayProp from './TypedArrayProp';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1'
};

class DicomPDFViewport extends Component {
  state = {
    fileURL: null,
    error: null
  };

  static propTypes = {
    byteArray: TypedArrayProp.uint8
  };

  renderPDF = dataSet => {
    const sopClassUid = dataSet.string('x00080016');

    if (sopClassUid !== SOP_CLASS_UIDS.ENCAPSULATED_PDF) {
      throw new Error('This is not a DICOM-encapsulated PDF');
    }

    const fileTag = dataSet.elements.x00420011;
    const offset = fileTag.dataOffset;
    const remainder = offset + fileTag.length;
    const pdfByteArray = dataSet.byteArray.slice(offset, remainder);
    const PDF = new Blob([pdfByteArray], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(PDF);

    this.setState({
      fileURL
    });
  };

  parseByteArray = byteArray => {
    const options = {
      untilTag: ''
    };

    let dataSet;

    try {
      dataSet = dicomParser.parseDicom(byteArray, options);
    } catch (error) {
      this.setState({
        error
      });
    }

    return dataSet;
  };

  componentDidMount() {
    const dataSet = this.parseByteArray(this.props.byteArray);

    this.renderPDF(dataSet);
  }

  render() {
    return (
      <div
        className={'DicomPDFViewport'}
        style={{ width: '100%', height: '100%' }}
      >
        {this.state.fileURL && (
          <object
            data={this.state.fileURL}
            type="application/pdf"
            width="100%"
            height="100%"
          />
        )}
        {this.state.error && <h2>{JSON.stringify(this.state.error)}</h2>}
      </div>
    );
  }
}

export default DicomPDFViewport;
