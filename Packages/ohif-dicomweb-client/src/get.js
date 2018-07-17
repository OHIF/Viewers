import makeRequest from "./makeRequest";

/**
 * Make a request to the URL given a set of options.
 * This function will add optional timing, request, and respone logging.
 *
 * @param {String} url
 * @param {Object} options
 * @return {Promise<*>}
 */
const get = async function get(url, options) {
    if (options.logRequests) {
        console.log(url);
    }

    if (options.logTiming) {
        console.time(url);
    }

    const result = await makeRequest(url, options);

    if (options.logTiming) {
        console.timeEnd(url);
    }

    if (options.logResponses) {
        console.info(result);
    }

    return result;
}

export default get;
