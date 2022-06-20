import readImageFile from 'itk/readImageFile';
import readImageDICOMFileSeries from 'itk/readImageDICOMFileSeries';
import writeArrayBuffer from 'itk/writeArrayBuffer';

import createDicomVolume from './createDicomVolume';

function volumeArrayToFileArray(volumeArray) {
  let fileArray = [];

  volumeArray.forEach(item => {
    fileArray.push(
      new File(
        [item.data],
        item.name,
        {
          lastModifiedDate: new Date(),
        })
    );
  });

  return fileArray;
}

async function createNiftiVolume(imageIds) {
  let niftiBuffer;

  const dicomVolume = await createDicomVolume(imageIds);

  const fileArray = volumeArrayToFileArray(dicomVolume);

  await readImageDICOMFileSeries(fileArray)
    .then(async readRes => {
      readRes.webWorkerPool.terminateWorkers();
      await writeArrayBuffer(
        null,
        true,
        readRes.image,
        'image.nii.gz')
        .then(writeRes => {
          writeRes.webWorker.terminate();
          niftiBuffer = writeRes.arrayBuffer;
        })
        .catch(err => {
          console.error(err);
        });
    })
    .catch(err => {
      console.error(err);
    });

  return niftiBuffer;
}

export default createNiftiVolume;
