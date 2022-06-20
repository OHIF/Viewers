import axios from 'axios';
import Pako from 'pako';
import { reshape } from 'mathjs';

export const client = axios.create({
  baseURL: 'https://radcadapi.thetatech.ai',
  timeout: 900000,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const reconstructSegs = ({ arr, rows, cols, slices }) => {
  const reshaped = reshape(arr, [slices, rows, cols]);
  console.log({ reshaped });
  return reshaped;
};

export const uncompress = ({ segmentation, shape }) => {
  const compressData = atob(segmentation);
  const splitCompressData = compressData.split('').map(function(e) {
    return e.charCodeAt(0);
  });
  const binData = new Uint8Array(splitCompressData);
  const data = Pako.inflate(binData);
  // const decoded = U8.decode(data);
  const dc = new TextDecoder().decode(data);
  // console.log({ data, decoded, dc });
  const dataArr = Array.from(data);
  const reconstructed = reconstructSegs({
    arr: dataArr,
    ...shape,
  });
  console.log({ dataArr, dc, buffer: data.buffer, reconstructed });
  return reconstructed; //data.buffer;
};
