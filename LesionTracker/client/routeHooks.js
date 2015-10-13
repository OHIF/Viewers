Router.onBeforeAction(function () {

  // User is logged in, go ahead and route them
  this.next();
});
