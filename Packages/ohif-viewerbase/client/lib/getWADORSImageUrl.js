export function getWADORSImageUrl(instance, frame) {
    let wadorsuri = instance.wadorsuri;

    if (!wadorsuri) {
        return;
    }

    // We need to sum 1 because WADO-RS frame number is 1-based
    frame = (frame || 0) + 1;

    // Replaces /frame/1 by /frame/{frame}
    // TODO: Maybe should be better to export the WADOProxy to be able to use it on client
    //       Example: WADOProxy.convertURL(baseWadoRsUri + '/frame/' + frame)
    wadorsuri = wadorsuri.replace(/(%2Fframes%2F)(\d+)/, `$1${frame}`);

    return wadorsuri;
}
