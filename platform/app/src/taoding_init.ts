export function taoding_init() {
  // Initialize the application
  // 获取url中的token参数
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || localStorage.getItem('token');

  if (token) {
    // 设置token到localStorage
    localStorage.setItem('token', token);
  } else {
    // 如果没有token，提示非法访问
    alert('非法访问');
    if (process.env.NODE_ENV === 'development') {
      window.location.href = 'http://127.0.0.1:8080/v/login';
    } else {
      window.location.href = 'http://47.115.206.154:8080/v/login';
    }
  }
}
