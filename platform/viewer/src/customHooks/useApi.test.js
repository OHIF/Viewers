import { renderHook, act } from '@testing-library/react-hooks';
import mockAxios from 'axios';
import useApi from '../customHooks/useApi';

describe('useApi Hook', () => {
  it('should use the API Layer to manage calls', async () => {
    const stubResponse = { status: 200, data: {} };
    const { result, waitForNextUpdate } = renderHook(() => useApi());

    mockAxios.request.mockResolvedValueOnce(stubResponse);

    await act(async () => {
      result.current.api.GET('/');
      await waitForNextUpdate();
    });

    expect(result.current.state.data).toBe(stubResponse);
  });

  it('should manage the loading status', async () => {
    const stubResponse = {};
    const { result, waitForNextUpdate } = renderHook(() => useApi());

    mockAxios.request.mockResolvedValueOnce(stubResponse);

    act(() => {
      result.current.api.GET('/');
    });

    await act(async () => {
      expect(result.current.state.isLoading).toBeTruthy();
      await waitForNextUpdate();
    });

    expect(result.current.state.isLoading).toBeFalsy();
  });

  it('should set error if something wrong happens', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useApi());
    const errorMessage = 'error!';
    mockAxios.request.mockRejectedValue(new Error(errorMessage));

    act(() => {
      result.current.api.GET('invalidUrl');
    });

    await act(async () => {
      expect(result.current.state.isError).toBeFalsy();
      await waitForNextUpdate();
    });

    expect(result.current.state.isError).toBeTruthy();
    expect(result.current.state.errorMessage).toBe(errorMessage);
  });
});
