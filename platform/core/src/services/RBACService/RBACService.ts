import { jwtDecode } from 'jwt-decode';

export default class RBACService {
  public static REGISTRATION = {
    name: 'rbacService',
    create: ({ configuration = {} }) => {
      return new RBACService();
    },
  };

  private token: string | null;
  private decodedToken: any;
  private role: string | null;
  private roles: string[];

  constructor() {
    this.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoicWMifQ.RtX6CxTx_vTVXs-GCt1euaXOgaZ11TWlm6hzPaMlGBA';
    this.decodedToken = null;
    this.role = 'qc';
    this.roles = ['site rep', 'reader', 'qc']; // Example roles
  }
  k;

  setToken(token: string) {
    this.token = token;
    this.decodedToken = jwtDecode(token); // Use .default to call the function
    this.role = this.decodedToken.role;
  }

  getRole() {
    return this.role;
  }

  hasAccess(feature: string) {
    const accessMap = {
      'site rep': ['ViewDICOMImage', 'WindowingTool', 'ChangeAxisOfImages', 'Zoom', 'Pan'],
      reader: [
        'Segmentation',
        'MPR',
        'FusionImaging',
        'SynchronizationOfViewports',
        'WindowingTool',
        'ChangeAxisOfImages',
        'Zoom',
        'Pan',
      ],
      qc: [
        'ViewSeries',
        'Segmentation',
        'ManualPixelRedaction',
        'WindowingTool',
        'ChangeAxisOfImages',
        'Zoom',
        'Pan',
        //totest
        'BrushTools',
        'ProgressDropdown',
        'Crosshairs',
        'RectangleROIStartEndThreshold',
        'MeasurementTools',
        'Zoom',
        'Pan',
        'TrackballRotate',
        'WindowLevel',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ],
    };

    return accessMap[this.role]?.includes(feature) || false;
  }

  canAccessMode(mode: string) {
    const modeAccessMap = {
      'site rep': ['@ohif/mode-longitudinal'],
      reader: ['@ohif/mode-longitudinal', '@ohif/mode-segmentation'],
      qc: [
        // '@ohif/mode-basic-dev-mode',
        // '@ohif/mode-test',
        '@ohif/mode-longitudinal',
        '@ohif/mode-segmentation',
        '@ohif/mode-tmtv',
        '@ohif/mode-microscopy',
        '@ohif/mode-preclinical-4d',
      ],
    };

    return modeAccessMap[this.role]?.includes(mode) || false;
  }

  getRoles() {
    return this.roles;
  }

  getActiveRole() {
    return this.role;
  }

  getJWTForRole(role: string) {
    const tokens = {
      reader:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicmVhZGVyIn0.s5g6s5g6s5g6s5g6s5g6s5g6s5g6s5g6',
      'site rep':
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2l0ZSByZXAifQ.s5g6s5g6s5g6s5g6s5g6s5g6s5g6s5g6',
      qc: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicWMifQ.s5g6s5g6s5g6s5g6s5g6s5g6s5g6s5g6',
    };

    return tokens[role];
  }
}
