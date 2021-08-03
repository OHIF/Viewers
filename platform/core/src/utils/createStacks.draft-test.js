// Leaving here as a starting point
// import createStacks from './createStacks.js';

// describe('createStacks.js', () => {
//   const seriesMetadatas = [
//     {
//       getInstanceCount: jest.fn().mockReturnValue(1),
//       getData: jest.fn().mockReturnValue({
//         SeriesDate: '2019-06-04',
//       }),
//     },
//     {
//       getInstanceCount: jest.fn().mockReturnValue(1),
//       getData: jest.fn().mockReturnValue({
//         SeriesDate: '2018-06-04',
//       }),
//     },
//   ];
//   const studyMetadata = {
//     getSeriesCount: jest.fn().mockReturnValue(2),
//     forEachSeries: jest.fn().mockImplementation(callback => {
//       callback(seriesMetadatas[0], 0);
//       callback(seriesMetadatas[1], 1);
//     }),
//     getStudyInstanceUID: jest.fn(),
//   };

//   it('sorts displaySets by SeriesNumber, then by SeriesDate', () => {
//     const displaySets = createStacks(studyMetadata);

//     expect(displaySets.length).toBe(2);
//   });
// });
