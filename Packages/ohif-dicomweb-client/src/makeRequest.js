import { Meteor } from "meteor/meteor";
import URL from 'url-parse';
import 'isomorphic-fetch';
import { btoa } from 'isomorphic-base64';
import getAccessToken from './getAccessToken.js';

async function makeRequest(url, options) {
    const parsed = new URL(url);

    let requestOpt = {
        method: 'GET',
        headers: {}
    };

    const accessToken = getAccessToken();
    if (accessToken) {
        requestOpt.headers = {
            Authorization: `Bearer ${accessToken}`
        };
    } else if (options.auth) {
        requestOpt.headers = {
            Authorization: `Basic ${btoa(options.auth)}`
        };
    }

    if (options.headers) {
        Object.keys(options.headers).forEach(key => {
            requestOpt.headers[key] = options.headers[key];
        });
    }

    if(options.method) {
        requestOpt.method = options.method;
    }

    if (options.method === 'POST' && options.body) {
        requestOpt.body = options.body;
    }

    return new Promise((resolve, reject) => {
        // TODO: Kept getting weird build errors from RegExp
        const isAbsolute = parsed.href.indexOf('http://') === 0 || parsed.href.indexOf('https://') === 0;

        let url = parsed.href;

        if (isAbsolute === false) {
            url = Meteor.absoluteUrl(parsed.href);
        }

        fetch(url, requestOpt).then((response) => {
            if (response.status >= 400) {
                reject(new Error(response.status));
            }

            if (response.status === 204) {
                resolve([]);
            } else {
                // TODO: Handle 204 no content
                resolve(response);
            }
        }, (error) => {
            console.error('There was an error in the DICOMWeb Server');

            reject(new Error(error));
        });
    });
}

export default makeRequest;
