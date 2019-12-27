import React, { Component, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

import './SimpleDialog.styl';

class SimpleDialog extends Component {
  static propTypes = {
    children: PropTypes.node,
    componentRef: PropTypes.any,
    componentStyle: PropTypes.object,
    rootClass: PropTypes.string,
    isOpen: PropTypes.bool,
    headerTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isOpen: true,
    componentStyle: {},
    rootClass: '',
  };

  static InputDialog = ({ onSubmit, defaultValue, title, label, onClose }) => {
    const [value, setValue] = useState(defaultValue);

    const onSubmitHandler = () => {
      onSubmit(value);
    };

    return (
      <div className="InputDialog">
        <SimpleDialog
          headerTitle={title}
          onClose={onClose}
          onConfirm={onSubmitHandler}
        >
          <TextInput
            type="text"
            value={value}
            onChange={event => setValue(event.target.value)}
            label={label}
          />
        </SimpleDialog>
      </div>
    );
  };

  static AnnotationDialog = ({ onClose, onSubmit }) => {
    let value = {};

    const { t, ready: translationsAreReady } = useTranslation(
      'AnnotationDialog'
    );

    const onSubmitHandler = () => {
      onSubmit(value);
    };

    return translationsAreReady ? (
      <div className="AnnotationDialog">
        <SimpleDialog
          headerTitle={t('annotations')}
          onClose={onClose}
          onConfirm={onSubmitHandler}
        >
          <label htmlFor="malignancy" className="simpleDialogLabelFor">
            {t('malignancy')}
          </label>
          <select
            name="malignancy"
            id="malignancy"
            className="simpleDialogSelect"
            onChange={event => (value.malignancy = event.target.value)}
          >
            <option value="undefined">--</option>
            <option value="non-malignant">{t('benign')}</option>
            <option value="malignant">{t('malignant')}</option>
          </select>
          <label htmlFor="margins" className="simpleDialogLabelFor">
            {t('margins')}
          </label>
          <select
            name="margins"
            id="margins"
            className="simpleDialogSelect"
            onChange={event => (value.margins = event.target.value)}
          >
            <option value="undefined">--</option>
            <option value="well-defined">{t('well-defined')}</option>
            <option value="darkened">{t('darkened')}</option>
            <option value="ill-defined">{t('ill-defined')}</option>
            <option value="microlobulated">{t('microlobulated')}</option>
            <option value="espiculado">{t('espiculado')}</option>
          </select>
          <label htmlFor="density" className="simpleDialogLabelFor">
            {t('density')}
          </label>
          <select
            name="density"
            id="density"
            className="simpleDialogSelect"
            onChange={event => (value.density = event.target.value)}
          >
            <option value="undefined">--</option>
            <option value="superior">{t('superior')}</option>
            <option value="similar">{t('similar')}</option>
            <option value="inferior">{t('inferior')}</option>
          </select>
          <label htmlFor="morphology" className="simpleDialogLabelFor">
            {t('morphology')}
          </label>
          <select
            name="morphology"
            id="morphology"
            className="simpleDialogSelect"
            onChange={event => (value.morphology = event.target.value)}
          >
            <option value="undefined">--</option>
            <option value="round">{t('round')}</option>
            <option value="oval">{t('oval')}</option>
            <option value="lobulate">{t('lobulate')}</option>
            <option value="irregular">{t('irregular')}</option>
          </select>
        </SimpleDialog>
      </div>
    ) : null;
  };

  render() {
    return (
      <React.Fragment>
        {this.props.isOpen && (
          <div
            className={`simpleDialog ${this.props.rootClass} `}
            ref={this.props.componentRef}
            style={this.props.componentStyle}
          >
            <form>
              <div className="header">
                <span className="closeBtn" onClick={this.onClose}>
                  <span className="closeIcon">x</span>
                </span>
                <h4 className="title">{this.props.headerTitle}</h4>
              </div>
              <div className="content">{this.props.children}</div>
              <div className="footer">
                <button className="btn btn-default" onClick={this.onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={this.onConfirm}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        )}
      </React.Fragment>
    );
  }

  onClose = event => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onClose();
  };

  onConfirm = event => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onConfirm();
  };
}

export { SimpleDialog };
