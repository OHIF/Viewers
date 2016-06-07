Template.caseProgress.onCreated(function caseProgressOnCreated() {
    const instance = Template.instance();

    instance.progressPercent = new ReactiveVar();
    instance.progressPercent.set(50);

    instance.progressText = new ReactiveVar();
    instance.progressText.set(5);

    instance.isLocked = new ReactiveVar(false);
});

Template.caseProgress.helpers({
    progressPercent() {
        return Template.instance().progressPercent.get();
    },

    progressText() {
        return Template.instance().progressText.get();
    },

    isLocked() {
        return Template.instance().isLocked.get();
    },

    progressComplete() {
        var progressPercent = Template.instance().progressPercent.get();
        return progressPercent === 100;
    }
});
