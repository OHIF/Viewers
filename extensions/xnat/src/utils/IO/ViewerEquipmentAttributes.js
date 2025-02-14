import { version } from '../../../package.json';

class ViewerEquipmentAttributes {
  constructor() {
    this.Manufacturer = 'ICR';
    this.ManufacturerModelName = 'XNAT-OHIF-VIEWER';
    this.SoftwareVersions = version;
  }
}

const viewerEquipmentAttributes = new ViewerEquipmentAttributes();

export default viewerEquipmentAttributes;
