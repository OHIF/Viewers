/*
Copyright (c) MONAI Consortium
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

function currentSegmentsInfo(segmentationService) {
  const info = {};
  const indices = new Set();

  const segmentations = segmentationService.getSegmentations();
  console.log('hello its me');
  if (segmentations && Object.keys(segmentations).length > 0) {
    const segmentation = segmentations['0'];
    const { segments } = segmentation.config;
    for (const segmentIndex of Object.keys(segments)) {
      const segment = segments[segmentIndex];
      info[segment.label] = {
        segmentIndex: segment.segmentIndex,
        color: segment.color,
      };
      indices.add(segment.segmentIndex);
    }
  }
  return { info, indices };
}

export { currentSegmentsInfo };
