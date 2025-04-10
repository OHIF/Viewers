import sessionMap from './sessionMap';

/**
 * checkAndSetPermissions - Queries the XNAT-ROI XAPI for the permissions the
 * user has for the roiCollection schema element, and stores the result in
 * Session variables.
 *
 * https://wiki.xnat.org/documentation/how-to-use-xnat/creating-and-managing-projects/understanding-data-sharing-in-xnat-s-security-structure/how-to-share-data-in-xnat
 * https://wiki.xnat.org/documentation/how-to-use-xnat/creating-and-managing-projects/understanding-data-sharing-in-xnat-s-security-structure
 *
 * @param  {string} projectId       The XNAT projectId.
 * @param  {string} parentProjectId The ID of the parent project.
 * @param {string} subjectId
 * @returns {null}
 */
export default function checkAndSetPermissions({
  projectId,
  parentProjectId,
  subjectId,
}) {
  const { xnatRootUrl } = sessionMap;
  const url = `${xnatRootUrl}xapi/roi/projects/${projectId}/permissions/RoiCollection`;

  sessionMap.setProject(projectId);
  sessionMap.setParentProject(parentProjectId);
  sessionMap.setSubject(subjectId);

  const permissions = {
    read: false,
    edit: false,
    create: false,
  };

  getPermissionsJson(url)
    .then(result => {
      const { status, response } = result;

      if (status === 200) {
        console.log(
          `permissions: create: ${response.create},
          read: ${response.read},
          edit: ${response.edit}`
        );

        permissions.read = response.read;
        permissions.edit = response.edit;
        permissions.create = response.create;
      } else {
        // Assume read only of project.
        console.log('Can only read from project');
        permissions.read = true;
      }
    })
    .catch(err => {
      console.log(err);
    })
    .finally(() => {
      sessionMap.setPermissions(permissions);
    });
}

/**
 * Queries the XNAT REST API for write permissions to the roiCollection schema
 * element.
 *
 * @param {string} url - The REST call to be made.
 * @returns {object} A parsed JSON representation of the permissions.
 */
function getPermissionsJson(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.send();
  });
}
