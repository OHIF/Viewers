/** A default viewport options */
export const viewportOptions = {
  toolGroupId: 'default',
  allowUnmatchedView: true,
  syncGroups: [
    {
      type: 'hydrateseg',
      id: 'sameFORId',
      source: true,
      target: true,
      options: {
        matchingRules: ['sameFOR'],
      },
    },
  ],
};

export const hydrateSegDefault = viewportOptions;
