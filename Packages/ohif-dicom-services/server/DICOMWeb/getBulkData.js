import { OHIF } from 'meteor/ohif:core';

const ASCII = 'ascii';
const http = Npm.require('http')
const url = Npm.require('url');

function getMultipartContentInfo(headers) {

    let dict = null,
        multipartRegex = /^\s*multipart\/[^;]+/g,
        contentType = headers['content-type'];

    if (typeof contentType === 'string' && multipartRegex.test(contentType)) {
        let match,
            pairRegex = /;\s*([^=]+)=([^;\r\n]+)/g;
        pairRegex.lastIndex = multipartRegex.lastIndex;
        while ((match = pairRegex.exec(contentType)) !== null) {
            let key = match[1], value = match[2];
            if (dict === null) {
                dict = {};
            }
            dict[key] = value;
        }
    }

    return dict;

}

function parseContentHeader(data, offset) {

    let endOfHeader = data.indexOf('\r\n\r\n', offset, ASCII);

    if (endOfHeader < 0 || endOfHeader <= offset || endOfHeader > data.length) {
        throw {
            name: 'DICOMWebContentParsingError',
            message: 'End of content header cannot be determined...'
        };
    }

    let match,
        header = {
            start: offset,
            end: endOfHeader + 4,
            fields: {}
        },
        headerRegex = /([\w\-]+):\s*([^\r\n]+)(?:\r\n)?/g,
        headerContentRegex = /\t([^\r\n]+)(?:\r\n)?/g,
        headerString = data.toString('ascii', offset, endOfHeader);

    while ((match = headerRegex.exec(headerString)) !== null) {
        let key = match[1].toLowerCase(), value = match[2];
        while (headerString.charAt(headerRegex.lastIndex) === '\t') {
            headerContentRegex.lastIndex = headerRegex.lastIndex;
            if ((match = headerContentRegex.exec(headerString)) !== null) {
                headerRegex.lastIndex = headerContentRegex.lastIndex;
                value += ' ' + match[1];
                continue;
            }
            break;
        }
        header.fields[key] = value;
    }

    return header;

}

function parseResponse(headers, data) {

    let contentInfo = getMultipartContentInfo(headers);

    if (!contentInfo || !contentInfo.boundary) {
        throw {
            name: 'DICOMWebContentParsingError',
            message: 'Content boundary not specified...'
        };
    }

    let boundary = contentInfo.boundary,
        delimiter = '--' + boundary + '\r\n',
        index = data.indexOf(delimiter, 0, ASCII);

    if (index < 0) {
        throw {
            name: 'DICOMWebContentParsingError',
            message: 'The specified boundary could not be found...'
        };
    }

    let closingIndex, closingDelimiter = Buffer.from('\r\n--' + boundary + '--', ASCII);

    index += delimiter.length;
    if (data[index] !== 0x0D || data[index + 1] !== 0x0A) {
        // multipart content headers are present, so let's parse them...
        let contentHeader = parseContentHeader(data, index);
        if (contentHeader && contentHeader.end > index) {
            if (contentHeader.fields['content-length'] > 0) {
                let endOfData = contentHeader.end + parseInt(contentHeader.fields['content-length'], 10);
                if (endOfData === data.indexOf(closingDelimiter, endOfData)) {
                    // content-length is valid...
                    return data.slice(contentHeader.end, endOfData);
                }
            }
            index = contentHeader.end;
        }
    } else {
        // no headers, the content comes right after...
        index += 2;
    }

    closingIndex = data.indexOf(closingDelimiter, index);
    if (closingIndex < 0 || closingIndex < index) {
        throw {
            name: 'DICOMWebContentParsingError',
            message: 'The end of the content could not be determined...'
        };
    }

    return data.slice(index, closingIndex);

}

function makeRequest(geturl, options, callback) {
    const headers = 'multipart/related; type=application/octet-stream';
    const parsed = url.parse(geturl);

    let requestOpt = {
        hostname: parsed.hostname,
        headers: {
            Accept: headers
        },
        path: parsed.path,
        method: 'GET',
    };

    let requester;
    if (parsed.protocol === 'https:') {
        requester = https.request;

        const allowUnauthorizedAgent = new https.Agent({ rejectUnauthorized: false });
        requestOpt.agent = allowUnauthorizedAgent
    } else {
        requester = http.request;
    }

    if (parsed.port) {
        requestOpt.port = parsed.port;
    }

    if (options.auth) {
        requestOpt.auth = options.auth;
    }

    let req = requester(requestOpt, function(resp) {

        let data = [];

        if (resp.statusCode !== 200) {
            callback({
                name: 'DICOMWebRequestError',
                message: `Unexpected status code for DICOMWeb response (${resp.statusCode})...`
            }, null);
        }

        resp.on('data', function(chunk) {
            data.push(chunk);
        });

        resp.on('error', function (responseError) {
            OHIF.log.error('There was an error in the DICOMWeb Server');
            OHIF.log.error(responseError.stack);
            OHIF.log.trace();

            callback(responseError, null);
        });

        resp.on('end', function() {
            try {
                callback(null, parseResponse(resp.headers, Buffer.concat(data)));
            } catch (error) {
                callback(error, null);
            }
        });

    });

    req.on('error', function (requestError) {
        OHIF.log.error('Couldn\'t connect to DICOMWeb server.');
        OHIF.log.error('Make sure you are trying to connect to the right server and that it is up and running.');
        OHIF.log.error(requestError.stack);
        OHIF.log.trace();

        callback(requestError, null);
    });

    req.end();

}

const makeRequestSync = Meteor.wrapAsync(makeRequest);

// TODO: Unify this stuff with the getJSON code
DICOMWeb.getBulkData = function(geturl, options) {

    if (options.logRequests) {
        OHIF.log.info(geturl);
    }

    if (options.logTiming) {
        console.time(geturl);
    }

    var result = makeRequestSync(geturl, options);

    if (options.logTiming) {
        console.timeEnd(geturl);
    }

    if (options.logResponses) {
        OHIF.log.info(result);
    }

    if (!Buffer.isBuffer(result)) {
        throw result;
    }

    return result;

};
