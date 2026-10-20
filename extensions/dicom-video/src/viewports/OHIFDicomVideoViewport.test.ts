import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import OHIFDicomVideoViewport from './OHIFDicomVideoViewport';

const mockViewportRef = { register: jest.fn(), unregister: jest.fn() };

jest.mock('@ohif/core', () => ({
  useViewportElementRegistration: () => mockViewportRef,
}));

const renderViewport = displaySet =>
  render(
    React.createElement(OHIFDicomVideoViewport, {
      displaySets: [displaySet],
      viewportId: 'viewport-1',
    })
  );

const getVideo = container => container.querySelector('video');

describe('OHIFDicomVideoViewport', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('plays the URL returned by getVideoUrl and revokes it on unmount', async () => {
    const revoke = jest.fn();
    const getVideoUrl = jest.fn().mockResolvedValue({ url: 'blob:video-1', revoke });

    const { container, unmount } = renderViewport({
      videoUrl: 'https://wado.example/video',
      getVideoUrl,
    });

    await waitFor(() => expect(getVideo(container)).not.toBeNull());
    const video = getVideo(container);
    expect(video.getAttribute('src')).toBe('blob:video-1');
    expect(video.hasAttribute('controls')).toBe(true);
    expect(getVideoUrl).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    expect(mockViewportRef.register).toHaveBeenCalled();

    unmount();
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(mockViewportRef.unregister).toHaveBeenCalled();
  });

  it('falls back to videoUrl when the data source has no rendered URL', async () => {
    const { container } = renderViewport({ videoUrl: 'https://wado.example/video' });

    await waitFor(() => expect(getVideo(container)).not.toBeNull());
    expect(getVideo(container).getAttribute('src')).toBe('https://wado.example/video');
  });

  it('shows a message when the video cannot be fetched', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const getVideoUrl = jest.fn().mockRejectedValue(new Error('network'));

    const { container } = renderViewport({ getVideoUrl });

    expect(await screen.findByText('Video could not be loaded')).toBeTruthy();
    expect(getVideo(container)).toBeNull();
    warn.mockRestore();
  });

  it('shows a message when the data source returns no URL', async () => {
    renderViewport({ getVideoUrl: jest.fn().mockResolvedValue({ url: null }) });

    expect(await screen.findByText('Video could not be loaded')).toBeTruthy();
  });

  it('revokes a URL that resolves after unmount', async () => {
    const revoke = jest.fn();
    let resolveUrl;
    const getVideoUrl = jest.fn(
      () =>
        new Promise(resolve => {
          resolveUrl = resolve;
        })
    );

    const { unmount } = renderViewport({ getVideoUrl });
    const [{ signal }] = getVideoUrl.mock.calls[0];
    unmount();
    expect(signal.aborted).toBe(true);

    await act(async () => {
      resolveUrl({ url: 'blob:late', revoke });
    });
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('rejects more than one display set', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        React.createElement(OHIFDicomVideoViewport, {
          displaySets: [{ videoUrl: 'a' }, { videoUrl: 'b' }],
        })
      )
    ).toThrow('only one display set');
    error.mockRestore();
  });
});
