# Embed the viewer using a script tag

<iframe src="https://codesandbox.io/embed/lrjoo3znxm?fontsize=14" style="width:100%; height:600px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## Important notes:

- You must correctly specify `rootUrl` **and** the HTML `<base>` tag.
- If your application runs in a subdirectory (e.g. /viewer/), this must be specified in `routerBasename`
- Currently, the WADO Image Loader Codecs and Web Worker source code must also be server at the ROOT URL
