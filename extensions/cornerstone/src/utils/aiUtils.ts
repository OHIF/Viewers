const models = [
  {
    name: 'sam-b-encoder',
    url: 'https://huggingface.co/schmuell/sam-b-fp16/resolve/main/sam_vit_b_01ec64.encoder-fp16.onnx',
  },
  {
    name: 'sam-b-decoder',
    url: 'https://huggingface.co/schmuell/sam-b-fp16/resolve/main/sam_vit_b_01ec64.decoder.onnx',
  },
];

export async function areModelsCached(): Promise<boolean> {
  const cache = await caches.open('onnx');
  for (const model of models) {
    const cachedResponse = await cache.match(model.url);
    if (!cachedResponse) {
      return false;
    }
  }
  return true;
}
