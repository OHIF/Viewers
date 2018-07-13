import get from './get.js';

const ASCII = 'ascii';

function getMultipartContentInfo(headers) {
    const multipartRegex = /^\s*multipart\/[^;]+/g;
    const contentType = headers.get('content-type');
    let dict = null;

    if (typeof contentType === 'string' && multipartRegex.test(contentType)) {
        let match;
        let pairRegex = /;\s*([^=]+)=([^;\r\n]+)/g;

        pairRegex.lastIndex = multipartRegex.lastIndex;
        while ((match = pairRegex.exec(contentType)) !== null) {
            let key = match[1]
            let value = match[2];

            if (dict === null) {
                dict = {};
            }
            dict[key] = value;
        }
    }

    return dict;
}

function parseContentHeader(data, offset) {
    const endOfHeader = data.indexOf('\r\n\r\n', offset);

    if (endOfHeader < 0 || endOfHeader <= offset || endOfHeader > data.length) {
        throw new Error('End of content header cannot be determined...');
    }

    const header = {
        start: offset,
        end: endOfHeader + 4,
        fields: {}
    };
    const headerRegex = /([\w\-]+):\s*([^\r\n]+)(?:\r\n)?/g;
    const headerContentRegex = /\t([^\r\n]+)(?:\r\n)?/g;
    const headerString = data.slice(offset, endOfHeader);

    let match;

    while ((match = headerRegex.exec(headerString)) !== null) {
        const key = match[1].toLowerCase(), value = match[2];

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

function toBytes(input) {
    const data = [];
    for (let i = 0; i < input.length; i++){
        data.push(input.charCodeAt(i));
    }

    return data;
}


function parseResponse(headers, data) {
    const contentInfo = getMultipartContentInfo(headers);

    if (!contentInfo || !contentInfo.boundary) {
        throw new Error('Content boundary not specified...');
    }

    const boundary = contentInfo.boundary;
    const delimiter = '--' + boundary + '\r\n';
    let index = data.indexOf(delimiter, 0, ASCII);

    if (index < 0) {
        throw new Error('DICOMWeb: The specified boundary could not be found...');
    }

    let closingIndex
    let closingDelimiter = '\r\n--' + boundary + '--';

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
        throw new Error('DICOMWeb: The end of the content could not be determined...')
    }

    return toBytes(data.slice(index, closingIndex));
}

const getBulkData = async function(url, options = {}) {
    options.headers = options.headers || {};
    options.headers.Accept = 'multipart/related; type=application/octet-stream';

    const response = await get(url, options);
    const data = await response.text();

    return parseResponse(response.headers, data);
}

export default getBulkData;
