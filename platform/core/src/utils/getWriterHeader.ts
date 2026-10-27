/** The longest value of a DICOM LO element. */
const LO_MAX_LENGTH = 64;

/**
 * The header attributes that name OHIF as the writer of a derived object
 * (SR, SEG or RTSTRUCT).
 *
 * `SoftwareVersions` is multi-valued: the OHIF version, then the version of
 * the library that builds the object data.  A missing version is written as
 * `unknown`.
 *
 * @param modelName - the library that builds the object data, written as
 *   `ManufacturerModelName`, e.g. `@cornerstonejs/adapters`
 * @param libraryLabel - the short library name in `SoftwareVersions`, e.g. `CS3D`
 * @param libraryVersion - the version of that library
 */
export function getWriterHeader(
  modelName: string,
  libraryLabel: string,
  libraryVersion?: string
): { Manufacturer: string; ManufacturerModelName: string; SoftwareVersions: string[] } {
  const versionText = (label: string, version?: string) =>
    `${label} ${version?.trim() || 'unknown'}`.slice(0, LO_MAX_LENGTH);

  return {
    Manufacturer: 'OHIF',
    ManufacturerModelName: modelName,
    SoftwareVersions: [
      versionText('OHIF', process.env.VERSION_NUMBER),
      versionText(libraryLabel, libraryVersion),
    ],
  };
}

export default getWriterHeader;
