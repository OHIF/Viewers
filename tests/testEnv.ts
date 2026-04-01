function readEnvFlag(name: string): boolean {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    return false;
  }
  return /^(1|true|yes)$/i.test(String(raw).trim());
}

/** True when CI marks an environment without reliable GPU (e.g. 3D volume rendering). Set `OHIF_NO_GPU`. */
export const noGpu = readEnvFlag('OHIF_NO_GPU');

/** True when overlay/UI text baselines differ (e.g. Linux headless vs local). Set `OHIF_LINUX_TEXT`. */
export const linuxText = readEnvFlag('OHIF_LINUX_TEXT');
