import { Readable } from 'stream';

const _streamToString = async (stream: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', err => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

export const downloadAsString = async download => {
  const stream = await download.createReadStream();
  return _streamToString(stream);
};
