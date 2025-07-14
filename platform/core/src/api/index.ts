interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: { [key: string]: string };
  body?: any;
  mode?: 'cors' | 'no-cors' | 'same-origin';
  credentials?: 'include' | 'same-origin' | 'omit';
}

interface RequestOptions extends FetchOptions {
  url: string;
}

class FetchTool {
  private defaultOptions: FetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    credentials: 'same-origin',
  };

  private requestInterceptors: Array<(options: FetchOptions) => FetchOptions> = [];
  private responseInterceptors: Array<(response: Response) => void> = [];

  public addRequestInterceptor(interceptor: (options: FetchOptions) => FetchOptions): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: (response: Response) => void): void {
    this.responseInterceptors.push(interceptor);
  }

  private async interceptRequest(options: FetchOptions): Promise<FetchOptions> {
    let newOptions = { ...options };
    for (const interceptor of this.requestInterceptors) {
      newOptions = (await interceptor(newOptions)) || newOptions;
    }
    return newOptions;
  }

  private async interceptResponse(response: Response): Promise<Response> {
    for (const interceptor of this.responseInterceptors) {
      interceptor(response);
    }
    return response;
  }

  public async request<T>(requestOptions: RequestOptions): Promise<T> {
    const options = { ...this.defaultOptions, ...requestOptions };
    const processedOptions = await this.interceptRequest(options);

    return fetch(requestOptions.url, processedOptions)
      .then(async response => {
        await this.interceptResponse(response);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        // 根据 Content-Type 来解析响应体
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          return response.json() as Promise<T>;
        } else {
          return response.text() as unknown as Promise<T>;
        }
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        throw error;
      });
  }
}

const fetchTool = new FetchTool();
// 添加请求拦截器
fetchTool.addRequestInterceptor(options => {
  if (!options.headers) options.headers = {};
  options.headers['Access-Key'] = `1750ffe109b19f47d2a9450e28e1a174`;
  return options;
});

// 添加响应拦截器
fetchTool.addResponseInterceptor(response => {
  if (response.status === 401) {
    console.log('Unauthorized access');
    // 执行相应的逻辑，如重定向到登录页等
  }
});

export async function uploadDATA_Api(marks) {
  
  const res = await fetchTool.request<{ name: string; age: number }>({
    url: 'http://47.115.206.154:8080/v2/dicom/tmp-data-dump',
    body: JSON.stringify({
      uid: marks[0].referenceStudyUID ,
      data: marks
    }),
  });
  console.log('Response:', res);
  return res;
}
