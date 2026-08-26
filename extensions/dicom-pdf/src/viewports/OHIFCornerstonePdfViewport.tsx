import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useViewportRef } from '@ohif/core';
import { DisplayableDocumentType } from '../utils/displayableDocumentTypes';
import {
  DocumentLoadFailureReason,
  loadDisplayableDocument,
} from '../utils/loadDisplayableDocument';
import './OHIFCornerstonePdfViewport.css';

const FAILURE_MESSAGES: Record<DocumentLoadFailureReason, string> = {
  'unsupported-type': 'This document type cannot be displayed',
  'signature-mismatch': 'Document content does not match its declared type',
  'fetch-failed': 'Unable to retrieve this document',
  aborted: 'Loading document…',
};

function OHIFCornerstonePdfViewport({ displaySets, viewportId = 'pdf-viewport' }) {
  const [embeddedDocument, setEmbeddedDocument] = useState<{
    url: string;
    documentType: DisplayableDocumentType;
  } | null>(null);
  const [failure, setFailure] = useState<DocumentLoadFailureReason | null>(null);
  const viewportElementRef = useRef(null);
  const viewportRef = useViewportRef(viewportId);

  useEffect(() => {
    document.body.addEventListener('drag', makePdfDropTarget);
    return function cleanup() {
      document.body.removeEventListener('drag', makePdfDropTarget);
      viewportRef.unregister();
    };
  }, []);

  const [style, setStyle] = useState('pdf-yes-click');

  const makePdfScrollable = () => {
    setStyle('pdf-yes-click');
  };

  const makePdfDropTarget = () => {
    setStyle('pdf-no-click');
  };

  if (displaySets && displaySets.length > 1) {
    throw new Error(
      'OHIFCornerstonePdfViewport: only one display set is supported for dicom pdf right now'
    );
  }

  const { renderedUrl, getRenderedUrl, mimeType, label } = displaySets[0];

  useEffect(() => {
    let isCancelled = false;
    let revokeUrl;
    const abortController = new AbortController();

    const load = async () => {
      let retrieved;

      try {
        retrieved = getRenderedUrl
          ? await getRenderedUrl({ signal: abortController.signal })
          : { url: await renderedUrl };
      } catch (error) {
        console.warn('Failed to retrieve document', error);
        retrieved = { url: null };
      }

      if (isCancelled) {
        retrieved?.revoke?.();
        return;
      }

      // The retrieved URL may be an origin-server URL or a Blob built from the
      // declared MIME type; either way its type is not trustworthy, so it is
      // only ever used as a source of bytes for loadDisplayableDocument.
      const result = await loadDisplayableDocument({
        url: retrieved?.url,
        mimeType,
        signal: abortController.signal,
      });

      retrieved?.revoke?.();

      if (isCancelled) {
        if (result.ok) {
          result.revoke();
        }
        return;
      }

      if (!result.ok) {
        setEmbeddedDocument(null);
        setFailure(result.reason);
        return;
      }

      revokeUrl = result.revoke;
      setEmbeddedDocument({ url: result.url, documentType: result.documentType });
      setFailure(null);
    };

    setEmbeddedDocument(null);
    setFailure(null);

    load();

    return () => {
      isCancelled = true;
      abortController.abort();
      revokeUrl?.();
    };
  }, [renderedUrl, getRenderedUrl, mimeType]);

  return (
    <div
      className="bg-primary-black text-foreground h-full w-full"
      onClick={makePdfScrollable}
      ref={el => {
        viewportElementRef.current = el;
        if (el) {
          viewportRef.register(el);
        }
      }}
      data-viewport-id={viewportId}
    >
      {embeddedDocument ? (
        renderDocument(embeddedDocument, style, label)
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {failure ? FAILURE_MESSAGES[failure] : 'Loading document…'}
        </div>
      )}
    </div>
  );
}

function renderDocument(
  { url, documentType }: { url: string; documentType: DisplayableDocumentType },
  style: string,
  label?: string
) {
  // <object> is used only for the types the allowlist marks as un-sandboxable -
  // in practice PDF, whose built-in browser viewer will not run in a sandboxed
  // browsing context. The type attribute now matches the Blob type exactly,
  // because loadDisplayableDocument set both from the same allowlist entry.
  if (documentType.strategy === 'object') {
    return (
      <object
        data={url}
        type={documentType.mimeType}
        className={style}
      >
        <div>No online viewer installed for {documentType.mimeType}</div>
      </object>
    );
  }

  return (
    <iframe
      src={url}
      title={label || 'Encapsulated document'}
      className={`${style} border-0`}
      sandbox={documentType.sandbox ?? ''}
      referrerPolicy="no-referrer"
      allow=""
    />
  );
}

OHIFCornerstonePdfViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  viewportId: PropTypes.string,
};

export default OHIFCornerstonePdfViewport;
