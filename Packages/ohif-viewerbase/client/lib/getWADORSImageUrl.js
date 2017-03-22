export function getWADORSImageUrl(instance, frame) {
    let wadorsuri = instance.wadorsuri;

    if (!wadorsuri) {
        return;
    }

    // We need to sum 1 because WADO-RS frame number is 1-based
    frame = (frame || 0) + 1;

    // Replaces /frame/1 by /frame/{frame}
    wadorsuri = wadorsuri.replace(/(%2Fframes%2F)(\d+)/, `$1${frame}`);

    return wadorsuri;
}
