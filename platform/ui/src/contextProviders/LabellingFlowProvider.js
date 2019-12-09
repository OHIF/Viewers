import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';

import { useDialog } from './DialogProvider';

const LabellingFlowContext = createContext(null);
const { Provider } = LabellingFlowContext;

export const useLabellingFlow = () => useContext(LabellingFlowContext);

const LabellingFlowProvider = ({
  children,
  service,
  labellingComponent: LabellingComponent,
  onUpdateLabelling,
}) => {
  const { create, dismiss } = useDialog();

  /**
   * Sets the implementation of a labelling flow service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        show,
        hide,
      });
    }
  }, [hide, service, show]);

  const hide = useCallback(() => dismiss({ id: 'labelling' }), [dismiss]);

  const show = useCallback(
    ({ centralize, defaultPosition, props }) => {
      hide();
      create({
        id: 'labelling',
        centralize,
        isDraggable: false,
        showOverlay: true,
        content: LabellingComponent,
        defaultPosition,
        contentProps: {
          visible: true,
          measurementData: props.measurementData,
          labellingDoneCallback: () => dismiss({ id: 'labelling' }),
          updateLabelling: labellingData =>
            _updateLabellingHandler(labellingData, props.measurementData),
          ...props,
        },
      });
    },
    [LabellingComponent, _updateLabellingHandler, create, dismiss, hide]
  );

  const _updateLabellingHandler = useCallback(
    (labellingData, measurementData) => {
      const { location, description, response } = labellingData;

      if (location) {
        measurementData.location = location;
      }

      measurementData.description = description || '';

      if (response) {
        measurementData.response = response;
      }

      onUpdateLabelling(labellingData, measurementData);
    },
    [onUpdateLabelling]
  );

  return (
    <Provider
      value={{
        show,
        hide,
      }}
    >
      {children}
    </Provider>
  );
};

/**
 * Higher Order Component to use the labelling flow methods through a Class Component.
 *
 * @returns
 */
export const withLabellingFlow = Component => {
  return function WrappedComponent(props) {
    const { show, hide } = useLabellingFlow();
    return (
      <Component
        {...props}
        modal={{
          show,
          hide,
        }}
      />
    );
  };
};

LabellingFlowProvider.defaultProps = {
  service: null,
};

LabellingFlowProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
  labellingComponent: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
  onUpdateLabelling: PropTypes.func.isRequired,
};

export default LabellingFlowProvider;

export const LabellingFlowConsumer = LabellingFlowContext.Consumer;
