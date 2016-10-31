const DEFAULT_THEME = 'tide';

const getActualTheme = () => sessionStorage.getItem('theme');

const setActualTheme = theme => sessionStorage.setItem('theme', theme);

const addThemeToBody = theme => document.body.classList.add('theme-' + theme);

const removeThemesFromBody = () => {
    const classList = document.body.classList;

    for (let i = classList.length - 1; i >= 0; i--) {
        if(classList[i].search('theme-') !== -1) {
            document.body.classList.remove(classList[i]);
        }
    }
};

Template.themeSelectorModal.onCreated(() => {
    const instance = Template.instance();
    let actualTheme = getActualTheme();
    if(!actualTheme) {
        actualTheme = DEFAULT_THEME;
        setActualTheme(actualTheme);
    }

    instance.state = new ReactiveDict();
    instance.state.set('selectedTheme', actualTheme);

    addThemeToBody(actualTheme);

    instance.container = {
        actualTheme,
        previewTheme(theme, state) {
            state.set('selectedTheme', theme);
            removeThemesFromBody();
            addThemeToBody(theme);
        },
        applyTheme(state) {
            setActualTheme(state.get('selectedTheme'));
        },
        resetState(state) {
            const theme = getActualTheme();

            state.set('selectedTheme', theme);
            removeThemesFromBody();
            addThemeToBody(theme);
        }
    };

});

Template.themeSelectorModal.helpers({
    themes: [ 'crickets', 'honeycomb', 'mint', 'overcast', 'quartz', 'tide', 'tigerlily' ],
    ucFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    },
    addClassIfSelected(theme) {
        const instance = Template.instance();

        return theme === instance.state.get('selectedTheme') ? 'selected' : '';
    }
});

Template.themeSelectorModal.events({
    'click .js-cancel, click .close': (event, instance) => instance.container.resetState(instance.state),
    'click .js-apply': (event, instance) => instance.container.applyTheme(instance.state),
    'click .preview-theme': (event, instance) => instance.container.previewTheme(event.currentTarget.dataset.theme, instance.state)
});
