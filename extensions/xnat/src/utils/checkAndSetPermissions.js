import sessionMap from './sessionMap';

/**
 * checkAndSetPermissions - Queries the XNAT-ROI XAPI for the permissions the
 * user has for the roiCollection schema element, and stores the result in
 * Session variables.
 *
 * @param  {type} projectId       The XNAT projectId.
 * @param  {type} parentProjectId The ID of the parent project. If the session
 *                                is not shared into another project, it will
 *                                be the same as the projectId.
 * @returns {null}
 */
export default function checkAndSetPermissions({
  projectId,
  parentProjectId,
  subjectId,
}) {
  const { xnatRootUrl, permissions } = sessionMap;
  const url = `${xnatRootUrl}xapi/roi/projects/${parentProjectId}/permissions/RoiCollection`;

  sessionMap.setProject(projectId);
  sessionMap.setParentProject(parentProjectId);
  sessionMap.setSubject(subjectId);

  getPermissionsJson(url)
    .then(result => {
      const { status, response } = result;

      if (status === 200) {
        console.log(
          `permissions: create: ${response.create},
          read: ${response.read},
          edit: ${response.edit}`
        );

        permissions.writePermissions = response.create;
        permissions.readPermissions = response.read;
        permissions.editPermissions = response.edit;

        // icrXnatRoiSession.set('writePermissions', response.create);
        // icrXnatRoiSession.set('readPermissions', response.read);
        // icrXnatRoiSession.set('editPermissions', response.edit);
      } else if (parentProjectId !== projectId) {
        // Assume read only of parent  project.
        console.log('Can only read from parent project');
        permissions.writePermissions = false;
        permissions.readPermissions = true;
        permissions.editPermissions = false;

        // icrXnatRoiSession.set('writePermissions', false);
        // icrXnatRoiSession.set('readPermissions', true);
        // icrXnatRoiSession.set('editPermissions', false);
      }
    })
    .catch(err => {
      console.log(err);

      permissions.writePermissions = false;
      permissions.readPermissions = false;
      permissions.editPermissions = false;
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
