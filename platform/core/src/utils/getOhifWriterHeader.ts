/** The longest value of a DICOM LO element. */
const LO_MAX_LENGTH = 64;

type WriterHeader = {
  Manufacturer: string;
  ManufacturerModelName: string;
  SoftwareVersions: string | string[];
};

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && !value.length);

/**
 * The header attributes that name OHIF as the writer of a derived object
 * (SR, SEG or RTSTRUCT).
 *
 * `SoftwareVersions` is multi-valued: the OHIF version, then the version of
 * the library that builds the object data.  A missing version is written as
 * `unknown`.  A value in `options` wins over the OHIF value; an empty value
 * (`undefined`, `null`, `''` or `[]`) keeps the OHIF value.
 *
 * @param modelName - the library that builds the object data, written as
 *   `ManufacturerModelName`, e.g. `@cornerstonejs/adapters`
 * @param libraryLabel - the short library name in `SoftwareVersions`, e.g. `CS3D`
 * @param libraryVersion - the version of that library
 * @param options - the save options of the caller
 */
export function getOhifWriterHeader(
  modelName: string,
  libraryLabel: string,
  libraryVersion?: string,
  options: Partial<WriterHeader> = {}
): WriterHeader {
  const versionText = (label: string, version?: string) =>
    `${label} ${version?.trim() || 'unknown'}`.slice(0, LO_MAX_LENGTH);

  const header: WriterHeader = {
    Manufacturer: 'OHIF',
    ManufacturerModelName: modelName,
    SoftwareVersions: [
      versionText('OHIF', process.env.VERSION_NUMBER),
      versionText(libraryLabel, libraryVersion),
    ],
  };
  for (const key of Object.keys(header)) {
    if (!isEmpty(options[key])) {
      header[key] = options[key];
    }
  }
  return header;
}

export default getOhifWriterHeader;
