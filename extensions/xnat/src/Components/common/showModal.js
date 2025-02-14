import { servicesManager } from '@ohif/app/src/App';


const showModal = (content, contentProps, title = '') => {
  const { UIModalService } = servicesManager.services;

  // Support onClose actions with callback
  let onClose = UIModalService.hide;
  if (contentProps && contentProps.onClose) {
    onClose = () => {
      contentProps.onClose();
      UIModalService.hide();
    };
  }

  if (UIModalService) {
    UIModalService.show({
      content: content,
      title: title,
      contentProps: {
        ...contentProps,
        onClose: onClose,
      },
      customClassName: 'modal-autoWidth',
    });
  }

  return { close: UIModalService.hide };
};

export default showModal;
