toggleDialog = element => {
    const $element = $(element);
    const isClosed = $element.hasClass('dialog-open');
    $element.toggleClass('dialog-closed', isClosed);
    $element.toggleClass('dialog-open', !isClosed);
};
