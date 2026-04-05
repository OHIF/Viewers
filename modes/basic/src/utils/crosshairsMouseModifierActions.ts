function createCrosshairsMouseModifierActions(commandsManager) {
  return [
    {
      id: 'crosshairsJump',
      label: 'Jump Crosshairs',
      defaultModifier: 'ctrl',
      onChange: (modifierKey?: string) => {
        commandsManager.runCommand('setCrosshairsJumpModifier', {
          toolGroupId: 'mpr',
          modifierKey,
        });
      },
    },
  ];
}

export { createCrosshairsMouseModifierActions };
