import get from './get.js';
import getAttribute from "./getAttribute";

const getJSON = async function (url, options) {
    options.headers = options.headers || {};
    options.headers.Accept = 'application/json';
    return get(url, options).then(response => {
        if (!(response instanceof Response)) {
            return '';
        }

        return response.json();
    });
};

export default getJSON;
