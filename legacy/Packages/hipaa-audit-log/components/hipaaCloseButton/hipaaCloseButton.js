Template.hipaaCloseButton.events({
  'click button': function() {
    var history = window.history;

    if(history.length > 0) {
      history.go(-1);
    }
    else {
      window.location = '/'
    }
  }
});