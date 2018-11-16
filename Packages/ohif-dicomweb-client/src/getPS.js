import get from './get.js';
import { ReadBufferStream } from './BufferStream.js';

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
            value = value.replace('\"','');
            value = value.replace('\"','');
            if (dict === null) {
                dict = {};
            }
            dict[key] = value;

        }
    }

    return dict;
}

function parseResponse(headers, data, response) {
    const contentInfo = getMultipartContentInfo(headers);

    if (!contentInfo || !contentInfo.boundary) {
        throw new Error('Content boundary not specified...');
    }

    const boundary = contentInfo.boundary;
    const delimiter = '--' + boundary + '\r\n';

    var stream = new ReadBufferStream(data);
    var offset = 0;
    stream.reset();
    var text = stream.readString(delimiter.length);
    if(text === delimiter)
        offset = delimiter.length;
    var i = 0;
    while(offset === delimiter.length){
        i++;
        if (stream.readString(1) === '\r'){
            if(stream.readString(1) === '\n'){
                offset= offset + i + 3;
            }
        }
    }
    let closingDelimiter = '\r\n--' + boundary + '--';
    var buffer = stream.getBuffer(offset, stream.size - (closingDelimiter.length + 2));
    return buffer;
}



const getPS = async function(url, options = {}) {
    options.headers = options.headers || {};
    const response = await get(url, options);
    const data = await response.arrayBuffer();
    return parseResponse(response.headers, data, response);
}

export default getPS;
