import { loadScript } from "../lib/utils"

loadScript("/packages/ohif_google-cloud/.npm/package/node_modules/healthcare-api-adapter/dist/vue.js", () => {
    loadScript("/packages/ohif_google-cloud/.npm/package/node_modules/healthcare-api-adapter/dist/gcp.min.js");
});


import './components';
