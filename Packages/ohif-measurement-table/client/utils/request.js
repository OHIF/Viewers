/**
 * XML Http Request promisify
 * 
 * @param obj - All information needed to perform the request
 * @param obj.method - request method type: GET, POST, PUT ...
 * @param obj.url - request url
 * @param obj.headers - request headers to be set
 * @param obj.body - request body to be sent
 * @param obj.responseType - type of expected request
 * 
 * @returns {Promise} Promise handling success and error status
 */

export default request = obj => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(obj.method || "GET", obj.url);
        if (obj.headers) {
            Object.keys(obj.headers).forEach(key => {
                xhr.setRequestHeader(key, obj.headers[key]);
            });
        }
        if (obj.responseType) {
            xhr.responseType = obj.responseType;
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(obj.body);
    });
};