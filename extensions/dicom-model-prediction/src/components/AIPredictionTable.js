import React, { Component } from 'react';

import './AIPredictionTableTable.css';
import Tabs from './Tabs';
import AISection from './AISection';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import ResultsSection from "./ResultsSection";

const { DicomLoaderService } = OHIF.utils;
// const overallWarnings = {
//   warningList: [
//     'All measurements should have a location',
//     'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
//   ],
// };
//
// const measurements = [
//   {
//     measurementId: '125',
//     measurementNumber: '125',
//     itemNumber: 1,
//     label: '(No description)',
//     data: [{ displayText: '12.5 x 4.6' }],
//   },
//   {
//     measurementId: '124',
//     measurementNumber: '124',
//     itemNumber: 2,
//     label: '(No description)',
//     data: [{ displayText: '32.5 x 1.6' }],
//   },
//   {
//     measurementId: '123',
//     measurementNumber: '123',
//     itemNumber: 3,
//     hasWarnings: true,
//     warningList: [
//       'All measurements should have a location',
//       'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
//     ],
//     label: '(No description)',
//     data: [{ displayText: '5.5 x 9.2' }],
//   },
// ];
//
// const additionalFindings = [
//   {
//     measurementId: '122',
//     measurementNumber: '122',
//     itemNumber: 1,
//     hasWarnings: true,
//     warningList: [
//       'All measurements should have a location',
//       'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
//     ],
//     label: '(No description)',
//     data: [{ displayText: '23.5 x 9.2' }],
//   },
//   {
//     measurementId: '121',
//     measurementNumber: '121',
//     itemNumber: 2,
//     hasWarnings: true,
//     warningList: [
//       'All measurements should have a location',
//       'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
//     ],
//     label: '(No description)',
//     data: [{ displayText: '11.2 x 9.2' }],
//   },
//   {
//     measurementId: '120',
//     measurementNumber: '120',
//     itemNumber: 3,
//     label: '(No description)',
//     data: [{ displayText: '2.9 x 9.2' }],
//   },
// ];
//
// const currentCollections = [
//   {
//     selectorAction: () => { },
//     maxMeasurements: 3,
//     groupName: 'Measurements',
//     measurements: measurements,
//   },
//   {
//     selectorAction: () => { },
//     groupName: 'Additional Findings',
//     measurements: additionalFindings,
//   },
// ];
//
// const comparisonColletions = [
//   {
//     selectorAction: () => { },
//     maxMeasurements: 3,
//     groupName: 'Measurements',
//     measurements: measurements,
//   },
//   {
//     selectorAction: () => { },
//     groupName: 'Additional Findings',
//     measurements: additionalFindings,
//   },
// ];
//
// const comparisonCollections = currentCollections.map((group, index) => {
//   return {
//     ...group,
//     measurements: group.measurements.map((measurement, measurementIndex) => {
//       const comparisonCollection = comparisonColletions[index].measurements;
//       if (measurementIndex < comparisonCollection.length) {
//         return {
//           ...measurement,
//           data: [
//             ...measurement.data,
//             ...comparisonCollection[measurementIndex].data,
//           ],
//         };
//       }
//     }),
//   };
// });
//
// const comparisonTimepoints = [
//   {
//     key: 'Current',
//     date: '10-Apr-18',
//   },
//   {
//     key: 'Comparison',
//     date: '15-Jun-18',
//   }
// ];

class AIPredictionTable extends Component {
  // state = {
  //   byteArray: null,
  //   error: null,
  // };
  //
  // static propTypes = {
  //   studies: PropTypes.object,
  //   displaySet: PropTypes.object,
  //   viewportIndex: PropTypes.number,
  //   viewportData: PropTypes.object,
  //   activeViewportIndex: PropTypes.number,
  //   setViewportActive: PropTypes.func,
  // };
  //
  // componentDidMount() {
  //   const { displaySet, studies } = this.props.viewportData;
  //
  //   DicomLoaderService.findDicomDataPromise(displaySet, studies).then(
  //     data => this.setState({ byteArray: new Uint8Array(data) }),
  //     error => {
  //       this.setState({ error });
  //       throw new Error(error);
  //     }
  //   );
  // }
  render() {
    return (
      <div className="AIPredictionTable">
        <div id="predictionTableContainer" className="flex-v">
          <Tabs>
            <div label="ai-section">
              <AISection servicesManager={this.props.servicesManager} />
            </div>
            <div label="results-section">
              <ResultsSection servicesManager={this.props.servicesManager} />
            </div>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default AIPredictionTable;
