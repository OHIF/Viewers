import DICOMWeb from '../../../DICOMWeb';

/**
 * Function to get series sequence (sequence of pepeating items where each
 * item includes the attributes of one or more series) based on a given sopInstance.
 *
 * @param {Object} instance The sop instance
 * @returns {Promise} Referenced series sequence
 */
const getReferencedSeriesSequence = instance => {
  const referencedSeriesSequenceRaw = instance['00081115'];

  const referencedSeriesSequence = [];

  if (referencedSeriesSequenceRaw && referencedSeriesSequenceRaw.Value) {
    referencedSeriesSequenceRaw.Value.forEach(referencedSeries => {
      const referencedSeriesInstanceUID = DICOMWeb.getString(
        referencedSeries['0020000E']
      );

      const referencedInstanceSequenceRaw = referencedSeries['0008114A'];
      const referencedInstanceSequence = [];

      referencedInstanceSequenceRaw.Value.forEach(referencedInstance => {
        referencedInstanceSequence.push({
          referencedSOPClassUID: DICOMWeb.getString(
            referencedInstance['00081150']
          ),
          referencedSOPInstanceUID: DICOMWeb.getString(
            referencedInstance['00081155']
          ),
        });
      });

      referencedSeriesSequence.push({
        referencedSeriesInstanceUID,
        referencedInstanceSequence,
      });
    });
  }

  return referencedSeriesSequence;
};

export default getReferencedSeriesSequence;
