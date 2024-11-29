class DynamicVolumeService {
  static REGISTRATION = {
    name: 'dynamicVolumeService',
    altName: 'DynamicVolumeService',
    create: ({ servicesManager }: Types.Extensions.ExtensionParams): DynamicVolumeService => {
      return new DynamicVolumeService();
    },
  };

  useDynamicVolume: boolean;

  constructor() {
    this.useDynamicVolume = false;
  }

  getUseDynamicVolume() {
    return this.useDynamicVolume;
  }

  setUseDynamicVolume(status: boolean) {
    this.useDynamicVolume = status;
  }

  onModeExit() {
    this.useDynamicVolume = false;
  }
}

export default DynamicVolumeService;
