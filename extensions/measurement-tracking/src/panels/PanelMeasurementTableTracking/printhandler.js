import React from 'react';
import { createRoot } from 'react-dom/client';

// 内部 LoadingSpinner 组件
const LoadingSpinner = ({ message = '正在准备打印...' }) => {
  return React.createElement(
    'div',
    {
      className: 'fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-75 z-50',
      style: { transition: 'opacity 0.3s ease-in-out' },
    },
    React.createElement(
      'div',
      {
        className: 'bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col items-center',
      },
      [
        React.createElement('div', {
          className:
            'w-12 h-12 border-4 border-t-blue-500 border-slate-600 rounded-full animate-spin mb-4',
        }),
        React.createElement('p', { className: 'text-slate-200' }, message),
      ]
    )
  );
};

const RENDER_CHECK_INTERVAL = 500;
const RENDER_TIMEOUT = 10000;
const PRINT_DIALOG_TIMEOUT = 300000;
const LOADING_AUTO_CLOSE_TIMEOUT = 10000;

// 通用的显示加载提示函数
const showLoadingSpinner = () => {
  const spinnerContainer = document.createElement('div');
  document.body.appendChild(spinnerContainer);
  const root = createRoot(spinnerContainer);
  root.render(React.createElement(LoadingSpinner));

  // 设置自动关闭定时器
  const autoCloseTimer = setTimeout(() => {
    console.log('LoadingSpinner 自动关闭 (10秒超时)');
    if (root && spinnerContainer) {
      try {
        root.unmount();
        spinnerContainer.remove();
      } catch (e) {
        console.warn('清理加载动画时出错:', e);
      }
    }
  }, LOADING_AUTO_CLOSE_TIMEOUT);

  return {
    container: spinnerContainer,
    root,
    cleanup: () => {
      clearTimeout(autoCloseTimer);
      if (root && spinnerContainer) {
        try {
          root.unmount();
          spinnerContainer.remove();
        } catch (e) {
          console.warn('清理加载动画时出错:', e);
        }
      }
    },
  };
};

// 等待图片加载
const waitForImages = async container => {
  const images = container.getElementsByTagName('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  });
  return Promise.all(imagePromises);
};

// 改进的图表检查逻辑
const checkChartsStatus = container => {
  const charts = container.querySelectorAll('canvas');
  if (charts.length === 0) {
    console.log('No charts found');
    return false;
  }

  return Array.from(charts).every(canvas => {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some(pixel => pixel !== 0);
  });
};

// 等待图表渲染完成的改进逻辑
const waitForCharts = async container => {
  let startTime = Date.now();
  let isUnmounted = false;
  let loadingSpinner = null;

  try {
    loadingSpinner = showLoadingSpinner();

    // 首先等待一个初始化时间，让图表开始渲染
    await new Promise(resolve => setTimeout(resolve, 500));

    return await new Promise((resolve, reject) => {
      let checkCount = 0;
      const maxChecks = RENDER_TIMEOUT / RENDER_CHECK_INTERVAL;

      const checkStatus = () => {
        if (isUnmounted) {
          return;
        }

        // 检查图表状态
        const isReady = checkChartsStatus(container);
        console.log('Chart rendering status:', isReady, 'Check count:', checkCount);

        if (isReady) {
          resolve();
          return;
        }

        // 检查是否超时
        checkCount++;
        if (checkCount >= maxChecks) {
          console.warn('图表渲染检查次数已达上限，强制继续');
          resolve();
          return;
        }

        // 更新加载消息
        if (!isUnmounted && loadingSpinner?.root) {
          try {
            const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
            loadingSpinner.root.render(
              React.createElement(LoadingSpinner, {
                message: `正在准备打印...${elapsedSeconds}秒`,
              })
            );
          } catch (e) {
            console.warn('更新加载消息时出错:', e);
          }
        }

        // 继续检查
        setTimeout(checkStatus, RENDER_CHECK_INTERVAL);
      };

      checkStatus();
    });
  } finally {
    isUnmounted = true;
    if (loadingSpinner) {
      loadingSpinner.cleanup();
    }
  }
};

// 设置打印样式
const setupPrintStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      #bmd-report, #bmd-report * {
        visibility: visible;
      }
      #bmd-report {
        position: absolute;
        left: 0;
        top: 0;
        width: 210mm;
        height: 297mm;
      }
      @page {
        size: A4;
        margin: 0;
      }
    }
  `;
  document.head.appendChild(style);
  return style;
};

// 处理打印
export const handlePrint = async reportContainer => {
  let loadingSpinner = null;
  let style = null;

  const cleanup = () => {
    if (loadingSpinner) {
      loadingSpinner.cleanup();
    }
    reportContainer.style.display = 'none';
    reportContainer.id = '';
    if (style) {
      style.remove();
    }
  };

  try {
    // 显示加载状态
    loadingSpinner = showLoadingSpinner();

    // 准备容器
    reportContainer.style.display = 'block';
    reportContainer.id = 'bmd-report';

    // 添加打印样式
    style = setupPrintStyles();

    // 等待内容准备就绪
    await Promise.all([
      waitForImages(reportContainer),
      waitForCharts(reportContainer),
      // 最小延迟
      new Promise(resolve => setTimeout(resolve, 500)),
    ]);

    // 触发打印
    window.print();

    // 等待打印对话框关闭
    return new Promise((resolve, reject) => {
      const mediaQueryList = window.matchMedia('print');
      mediaQueryList.addEventListener(
        'change',
        mql => {
          if (!mql.matches) {
            cleanup();
            resolve();
          }
        },
        { once: true }
      );

      // 打印对话框超时
      setTimeout(() => {
        cleanup();
        reject(new Error('打印对话框超时'));
      }, PRINT_DIALOG_TIMEOUT);
    });
  } catch (error) {
    console.error('打印错误:', error);
    cleanup();
    throw error;
  }
};

export const exportToPDF = async reportContainer => {
  return handlePrint(reportContainer);
};
