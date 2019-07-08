// Reference > https://reactjs.org/docs/context.html
import React from 'react';
import {
  withTranslation as I18NextWithTranslation,
  I18nextProvider,
} from 'react-i18next';
import i18n from '@ohif/i18n';

const WrapperI18n = Component => {
  const WrapperComponent = props => (
    <I18nextProvider i18n={i18n}>
      <Component {...props} />
    </I18nextProvider>
  );

  return WrapperComponent;
};

const withTranslation = namespace => Component => {
  const TranslatedComponent = props => {
    return <Component {...props} />;
  };

  return WrapperI18n(I18NextWithTranslation(namespace)(TranslatedComponent));
};

export { withTranslation };
export default withTranslation;
