import loadScript from './loadScript';

export default function loadHealthcareApiAdapter() {
  loadScript('/ohif_google-cloud/vue.js', () => {
    loadScript('/ohif_google-cloud/gcp.min.js');
  });
}
