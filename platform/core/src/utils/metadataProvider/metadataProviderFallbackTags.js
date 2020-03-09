import log from '../../log';

function getFallbackTagFromInstance(tag, instance) {
  if (instance[tag]) {
    return instance[tag];
  }

  const fallbackTags = fallbackTagsMap[tag];

  if (fallbackTags) {
    for (let i = 0; i < fallbackTags.length; i++) {
      const fallbackTag = fallbackTags[i];

      if (instance[fallbackTag]) {
        log.info(`metadata provider fallback tag ${tag} to ${fallbackTag}`);

        return instance[fallbackTag];
      }
    }
  }
}

const fallbackTagsMap = {
  PixelSpacing: ['ImagerPixelSpacing'],
};

export { fallbackTagsMap, getFallbackTagFromInstance };
