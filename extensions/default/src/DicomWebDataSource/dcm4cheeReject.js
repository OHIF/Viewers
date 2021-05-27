/**
 * Rejects a given series latest structured report.
 *
 * @param {string} wadoRoot
 * @returns
 */
export default function(wadoRoot) {
  return {
    series: (StudyInstanceUID, SeriesInstanceUID) =>
      new Promise((resolve, reject) => {
        try {
          /** Reject because of Quality. (Seems the most sensible out of the options) */
          const CodeValueAndCodeSchemeDesignator = `113001%5EDCM`;
          const url = `${wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/reject/${CodeValueAndCodeSchemeDesignator}`;
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, true);
          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
              switch (xhr.status) {
                case 204:
                  resolve(xhr.responseText);
                  break;
                case 404:
                  reject(
                    'Your dataSource does not support reject functionality'
                  );
              }
            }
            if (xhr.readyState === XMLHttpRequest.DONE) {
              resolve();
            }
          };
          xhr.send();
        } catch (error) {
          reject(error);
        }
      }),
  };
}
