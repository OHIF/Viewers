import data from './test.json';
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
    // url: 'http://47.115.206.154:8080/v2/tasks/mark-data',
    url: 'http://192.168.6.242:8080/v2/tasks/mark-data',
    body: JSON.stringify({
      action: 'save',
      time: 1752228099433,
      task_id: 20253,
      mark_status: 0,
      work_type: '1',
      access: '3',
      use_time: 922,
      status: '1',
      markData: {
        imgUrl:
          'http://47.115.206.154:18188/default/ds_3p7tms8e4wpwmgbqu2jv/2506230647/img/img/e81ef39b-233152af.jpg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin%2F20250706%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250706T160000Z&X-Amz-SignedHeaders=host&X-Amz-Expires=604800&X-Amz-Signature=f9d9e3341cacc8cfd7d2bd234870ca316392a6d4355a3cb696b4540e542f724e',
        width: 1280,
        height: 720,
        totalNums: {
          line: 0,
          polygon: 20,
          rect: 0,
          point: 0,
          cuboid: 0,
          curve: 0,
          parallel: 0,
          ellipse: 0,
          '3drect': 0,
          magic: 0,
        },
        printscreen: '',
        rotateDeg: 0,
        marks: marks,
      },
    }),
  });
  console.log('Response:', res);
  return res;
}
