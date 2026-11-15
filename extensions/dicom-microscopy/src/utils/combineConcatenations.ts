import toArray from './toArray';

type Instance = {
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
  SOPInstanceUID: string;
  NumberOfFrames: number | string;
  DimensionOrganizationType?: string;
  ConcatenationUID?: string;
  SOPInstanceUIDOfConcatenationSource?: string;
  ConcatenationFrameOffsetNumber?: number | string;
  InConcatenationTotalNumber?: number | string;
  PerFrameFunctionalGroupsSequence?: object | object[];
  [attribute: string]: unknown;
};

type FrameRequest = {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  frameNumbers: (number | string)[] | string;
  [option: string]: unknown;
};

type Client = {
  retrieveInstanceFrames: (options: FrameRequest) => Promise<ArrayBuffer[]>;
};

const instanceKey = (study: string, series: string, instance: string) =>
  `${study}/${series}/${instance}`;

/**
 * Present TILED_FULL concatenations as logical images to dicom-microscopy-viewer.
 * Its implicit tile mapping otherwise assigns the entire matrix to every part,
 * so the last part overwrites all frame URLs. Keep the original instances in the
 * data source and translate logical frame numbers at the client boundary instead.
 * The client belongs to this viewport, including for the dicomlocal data source.
 * DICOM PS3.3 C.7.6.16 defines zero-based concatenation offsets and one-based
 * frame numbers: https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.6.16.html
 */
export default function combineConcatenations(instances: Instance[], client: Client): Instance[] {
  const groups = new Map<string, Instance[]>();
  const images: Instance[] = [];

  instances.forEach(instance => {
    if (instance.DimensionOrganizationType !== 'TILED_FULL' || !instance.ConcatenationUID) {
      images.push(instance);
      return;
    }
    const key = instanceKey(
      instance.StudyInstanceUID,
      instance.SeriesInstanceUID,
      instance.ConcatenationUID
    );
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(instance);
  });

  if (!groups.size) {
    return instances;
  }

  const concatenations = new Map<string, Instance[]>();
  groups.forEach(parts => {
    parts.sort(
      (a, b) => Number(a.ConcatenationFrameOffsetNumber) - Number(b.ConcatenationFrameOffsetNumber)
    );
    const first = parts[0];
    const sourceUID = first.SOPInstanceUIDOfConcatenationSource;
    let numberOfFrames = 0;
    parts.forEach(part => {
      const count = Number(part.NumberOfFrames);
      if (
        !sourceUID ||
        part.SOPInstanceUIDOfConcatenationSource !== sourceUID ||
        Number(part.ConcatenationFrameOffsetNumber) !== numberOfFrames ||
        !Number.isSafeInteger(count) ||
        count < 1 ||
        (part.InConcatenationTotalNumber != null &&
          Number(part.InConcatenationTotalNumber) !== parts.length)
      ) {
        throw new Error(
          `Incomplete or inconsistent microscopy concatenation: ${first.ConcatenationUID}`
        );
      }
      numberOfFrames += count;
    });

    const image: Instance = {
      ...first,
      SOPInstanceUID: sourceUID,
      NumberOfFrames: numberOfFrames,
    };
    // These attributes describe individual parts, not the logical image.
    delete image.ConcatenationUID;
    delete image.ConcatenationFrameOffsetNumber;
    delete image.InConcatenationNumber;
    delete image.InConcatenationTotalNumber;
    delete image.SOPInstanceUIDOfConcatenationSource;
    delete image.PixelData;

    if (parts.some(part => part.PerFrameFunctionalGroupsSequence)) {
      image.PerFrameFunctionalGroupsSequence = parts.flatMap(part =>
        part.PerFrameFunctionalGroupsSequence
          ? toArray(part.PerFrameFunctionalGroupsSequence)
          : Array.from({ length: Number(part.NumberOfFrames) }, () => ({}))
      );
    }
    images.push(image);
    concatenations.set(
      instanceKey(image.StudyInstanceUID, image.SeriesInstanceUID, sourceUID),
      parts
    );
  });

  const retrieveInstanceFrames = client.retrieveInstanceFrames.bind(client);
  client.retrieveInstanceFrames = async options => {
    const parts = concatenations.get(
      instanceKey(options.studyInstanceUID, options.seriesInstanceUID, options.sopInstanceUID)
    );
    if (!parts) {
      return retrieveInstanceFrames(options);
    }

    const frameNumbers = toArray(
      typeof options.frameNumbers === 'string'
        ? options.frameNumbers.split(',')
        : options.frameNumbers
    ).map(Number);
    const requests = new Map<Instance, { frames: number[]; indices: number[] }>();
    frameNumbers.forEach((frame, index) => {
      const part = parts.find(part => {
        const offset = Number(part.ConcatenationFrameOffsetNumber);
        return frame > offset && frame <= offset + Number(part.NumberOfFrames);
      });
      if (!part) {
        throw new Error(
          `Frame ${frame} is outside microscopy concatenation ${options.sopInstanceUID}`
        );
      }
      if (!requests.has(part)) {
        requests.set(part, { frames: [], indices: [] });
      }
      requests.get(part).frames.push(frame - Number(part.ConcatenationFrameOffsetNumber));
      requests.get(part).indices.push(index);
    });

    const frames: ArrayBuffer[] = [];
    await Promise.all(
      Array.from(requests, async ([part, request]) => {
        const retrieved = await retrieveInstanceFrames({
          ...options,
          sopInstanceUID: part.SOPInstanceUID,
          frameNumbers: request.frames,
        });
        request.indices.forEach((index, i) => {
          frames[index] = retrieved[i];
        });
      })
    );
    return frames;
  };

  return images;
}
