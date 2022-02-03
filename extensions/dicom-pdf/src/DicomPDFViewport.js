import React, { Component, createRef } from 'react';
import dicomParser from 'dicom-parser';
import PDFJS from 'pdfjs-dist';
import PropTypes from 'prop-types';

import TypedArrayProp from './TypedArrayProp';
import './DicomPDFViewport.css';

import pdfjsBuild from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
pdfjsBuild.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  ENCAPSULATED_PDF: '1.2.840.10008.5.1.4.1.1.104.1',
};

class DicomPDFViewport extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fileURL: null,
      error: null,
      currentPageIndex: 1,
      pdf: null,
      scale: 1,
    };

    this.canvas = createRef();
    this.textLayer = createRef();
  }

  static propTypes = {
    byteArray: TypedArrayProp.uint8,
    rawPdf: PropTypes.bool,
    useNative: PropTypes.bool,
    viewportData: PropTypes.object,
    activeViewportIndex: PropTypes.number,
    setViewportActive: PropTypes.func,
    viewportIndex: PropTypes.number,
  };

  static defaultProps = {
    useNative: false,
  };

  async componentDidMount() {
    const { rawPdf } = this.props
    const dataSet = !rawPdf && this.parseByteArray(this.props.byteArray);
    const fileURL = this.getPDFFileUrl(dataSet, this.props.byteArray);

    this.setState(state => ({ ...state, fileURL }));

    if (!this.props.useNative) {
      const pdf = await PDFJS.getDocument(fileURL).promise;
      this.setState(state => ({ ...state, pdf }), () => this.updatePDFCanvas());
    }
  }

  updatePDFCanvas = async () => {
    const { pdf, scale, currentPageIndex } = this.state;
    const context = this.canvas.getContext('2d');

    const page = await pdf.getPage(currentPageIndex);
    let viewport = page.getViewport({ scale });

    this.canvas.height = viewport.height;
    this.canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext);
    const textContent = await page.getTextContent();

    this.textLayer.innerHTML = '';
    this.textLayer.style.height = viewport.height + 'px';
    this.textLayer.style.width = viewport.width + 'px';

    PDFJS.renderTextLayer({
      textContent,
      container: this.textLayer,
      viewport,
      textDivs: [],
    });
  };

  componentDidUpdate(prevProps, prevState) {
    const { currentPageIndex, scale } = this.state;
    const newValidScale = prevState.scale !== scale && scale > 0;
    const newValidPageNumber =
      prevState.currentPageIndex !== currentPageIndex && currentPageIndex > 0;

    if (newValidScale || newValidPageNumber) {
      this.updatePDFCanvas();
    }
  }

  getPDFFileUrl = (dataSet, byteArray) => {
    let pdfByteArray = byteArray;

    if (dataSet) {
      const SOPClassUID = dataSet.string('x00080016');

      if (SOPClassUID !== SOP_CLASS_UIDS.ENCAPSULATED_PDF) {
        throw new Error('This is not a DICOM-encapsulated PDF');
      }

      const fileTag = dataSet.elements.x00420011;
      const offset = fileTag.dataOffset;
      const remainder = offset + fileTag.length;
      pdfByteArray = dataSet.byteArray.slice(offset, remainder);
    }

    const PDF = new Blob([pdfByteArray], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(PDF);

    return fileURL;
  };

  onPageChange = async event => {
    const { currentPageIndex, pdf } = this.state;
    let newPageIndex = currentPageIndex;

    const action = event.target.getAttribute('data-pager');
    if (action === 'prev') {
      if (currentPageIndex === 1) {
        return;
      }
      newPageIndex -= 1;
      if (currentPageIndex < 0) {
        newPageIndex = 0;
      }
    }

    if (action === 'next') {
      if (currentPageIndex === pdf.numPages - 1) {
        return;
      }
      newPageIndex += 1;
      if (currentPageIndex > pdf.numPages - 1) {
        newPageIndex = pdf.numPages - 1;
      }
    }

    this.setState(state => ({ ...state, currentPageIndex: newPageIndex }));
  };

  onZoomChange = () => {
    let newZoomValue = this.state.scale;

    const action = event.target.getAttribute('data-pager');

    if (action === '+') {
      newZoomValue += 0.25;
    }

    if (action === '-') {
      newZoomValue -= 0.25;
    }

    this.setState(state => ({ ...state, scale: newZoomValue }));
  };

  parseByteArray = byteArray => {
    const options = { untilTag: '' };

    let dataSet;
    try {
      dataSet = dicomParser.parseDicom(byteArray, options);
    } catch (error) {
      this.setState(state => ({ ...state, error }));
    }

    return dataSet;
  };

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

  downloadPDFCanvas = () => {
    const { fileURL } = this.state;
    const a = document.createElement('a');
    a.href = fileURL;
    a.download = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  render() {
    const { fileURL, pdf, error } = this.state;

    return (
      <div
        className={'DicomPDFViewport'}
        onClick={this.setViewportActiveHandler}
        onScroll={this.setViewportActiveHandler}
        style={{ width: '100%', height: '100%' }}
      >
        {!this.props.useNative ? (
          <>
            <div id="toolbar">
              <div id="pager">
                {pdf && pdf.numPages > 1 && (
                  <>
                    <button data-pager="prev" onClick={this.onPageChange}>
                      {`<`}
                    </button>
                    <button data-pager="next" onClick={this.onPageChange}>
                      {`>`}
                    </button>
                  </>
                )}
                <button data-pager="-" onClick={this.onZoomChange}>
                  {`-`}
                </button>
                <button data-pager="+" onClick={this.onZoomChange}>
                  {`+`}
                </button>
                <button onClick={this.downloadPDFCanvas}>Download</button>
              </div>
            </div>
            <div id="canvas">
              <div id="pdf-canvas-container">
                <canvas
                  id="pdf-canvas"
                  ref={canvas => (this.canvas = canvas)}
                />
                <div
                  id="text-layer"
                  ref={textLayer => (this.textLayer = textLayer)}
                ></div>
              </div>
            </div>
          </>
        ) : (
          <object
            aria-label="PDF Viewer"
            data={fileURL}
            type="application/pdf"
            width="100%"
            height="100%"
          />
        )}
        {error && <h2>{JSON.stringify(error)}</h2>}
      </div>
    );
  }
}

export default DicomPDFViewport;
