/**
 * getCommandsModule - Provides commands for theme manipulation
 * @param {Object} params - Extension params
 * @returns {Object} Commands module definition
 */
export default function getCommandsModule({ servicesManager }) {
  return {
    actions: {},
    definitions: {
      setViewerTheme: {
        commandFn: ({ theme }) => {
          const rootElement = document.documentElement;

          if (theme === 'dental') {
            rootElement.classList.add('dental-theme');
            rootElement.classList.remove('ohif-theme');
            localStorage.setItem('viewerTheme', 'dental');
          } else {
            rootElement.classList.add('ohif-theme');
            rootElement.classList.remove('dental-theme');
            localStorage.setItem('viewerTheme', 'ohif');
          }
        },
        storeContexts: [],
        options: {},
      },
      toggleViewerTheme: {
        commandFn: () => {
          const rootElement = document.documentElement;
          const isDental = rootElement.classList.contains('dental-theme');

          if (isDental) {
            rootElement.classList.add('ohif-theme');
            rootElement.classList.remove('dental-theme');
            localStorage.setItem('viewerTheme', 'ohif');
          } else {
            rootElement.classList.add('dental-theme');
            rootElement.classList.remove('ohif-theme');
            localStorage.setItem('viewerTheme', 'dental');
          }
        },
        storeContexts: [],
        options: {},
      },
      getViewerTheme: {
        commandFn: () => {
          return localStorage.getItem('viewerTheme') || 'ohif';
        },
        storeContexts: [],
        options: {},
      },
    },
    defaultContext: 'DEFAULT',
  };
}
