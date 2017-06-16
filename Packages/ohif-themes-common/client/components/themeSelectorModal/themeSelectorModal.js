import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

const DEFAULT_THEME = 'tide';

const getCurrentTheme = () => sessionStorage.getItem('theme');

const setActualTheme = theme => sessionStorage.setItem('theme', theme);

const addThemeToBody = theme => document.body.classList.add('theme-' + theme);

const removeThemesFromBody = () => {
    const classList = document.body.classList;

    for (let i = classList.length - 1; i >= 0; i--) {
        if (classList[i].search('theme-') !== -1) {
            document.body.classList.remove(classList[i]);
        }
    }
};

Template.themeSelectorModal.onCreated(() => {
    const instance = Template.instance();
    let currentTheme = getCurrentTheme();
    if (!currentTheme) {
        currentTheme = DEFAULT_THEME;
        setActualTheme(currentTheme);
    }

    instance.state = new ReactiveDict();
    instance.state.set('selectedTheme', currentTheme);

    addThemeToBody(currentTheme);

    instance.container = {
        currentTheme,

        previewTheme(theme, state) {
            state.set('selectedTheme', theme);
            removeThemesFromBody();
            addThemeToBody(theme);
        },

        applyTheme(state) {
            setActualTheme(state.get('selectedTheme'));
        },

        resetState(state) {
            const theme = getCurrentTheme();

            state.set('selectedTheme', theme);
            removeThemesFromBody();
            addThemeToBody(theme);
        }
    };

    const { promise } = instance.data;
    promise.then(() => instance.container.applyTheme(instance.state));
    promise.catch(() => instance.container.resetState(instance.state));
});

Template.themeSelectorModal.helpers({
    themes: [ 'crickets', 'honeycomb', 'mint', 'overcast', 'quartz', 'tide', 'tigerlily' ],

    ucFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    },

    printClassIfSelected(theme) {
        const instance = Template.instance();

        return theme === instance.state.get('selectedTheme') ? 'selected' : '';
    }
});

Template.themeSelectorModal.events({
    'click .preview-theme'(event, instance) {
        instance.container.previewTheme(event.currentTarget.dataset.theme, instance.state);
    }
});
