Template.lastLoginModal.helpers({
    lastLoginDate: function() {
        var userLoginDate = ReactiveMethod.call('getPriorLoginDate');
        if (userLoginDate && userLoginDate.priorLoginDate) {
            return moment(userLoginDate.priorLoginDate).format("MMMM Do YYYY, HH:mm:ss A");
        }
        return;
    }
});