import { servicesManager } from '@ohif/viewer/src/App';

import './XNATModal.styl';

const showModal = (content, contentProps, title = '') => {
  const { UIModalService } = servicesManager.services;

  if (UIModalService) {
    UIModalService.show({
      content: content,
      title: title,
      contentProps: {
        ...contentProps,
        onClose: UIModalService.hide,
      },
      customClassName: 'modal-autoWidth',
    });
  }

  return { close: UIModalService.hide };
};

export default showModal;
