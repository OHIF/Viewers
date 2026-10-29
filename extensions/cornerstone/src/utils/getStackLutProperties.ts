/**
 * The LUT properties a stack viewport should apply from a saved LUT presentation.
 *
 * A volume viewport saves its LUT presentation as a Map of properties per volume id,
 * a stack viewport as one properties object, and both use the same presentation id
 * (the display set's). Going from a volume layout (MPR) back to a stack handed the Map
 * to the stack, which can't read it, so invert and window level were lost. This takes
 * the volume's entry and keeps only what means the same on a stack: a volume's
 * colormap ("X Ray" while inverted, which would invert the stack a second time) and
 * its rendering settings stay with the volume.
 *
 * @param properties - The saved LUT properties: an object, or a Map per volume id.
 * @returns The properties to apply to the stack viewport.
 */
export default function getStackLutProperties<
  T extends { invert?: boolean; voiRange?: unknown; VOILUTFunction?: unknown },
>(properties: T | Map<string, T> | undefined): Partial<T> | undefined {
  if (!(properties instanceof Map)) {
    return properties;
  }
  const [volumeProperties] = properties.values();
  if (!volumeProperties) {
    return undefined;
  }
  const { invert, voiRange, VOILUTFunction } = volumeProperties;
  return Object.fromEntries(
    Object.entries({ invert, voiRange, VOILUTFunction }).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
