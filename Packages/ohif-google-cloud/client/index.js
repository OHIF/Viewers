import { loadScript } from "../lib/utils"

loadScript("/packages/ohif_google-cloud/healthcare-api-adapter/dist/vue.js", () => {
    loadScript("/packages/ohif_google-cloud/healthcare-api-adapter/dist/gcp.min.js");
});


import './components';
