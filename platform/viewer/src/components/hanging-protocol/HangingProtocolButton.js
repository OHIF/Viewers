/* eslint-disable react/prop-types */
import React from 'react';
import { ToolbarButton } from '@ohif/ui';
import OHIF, { hangingProtocols } from '@ohif/core';
import { connect } from 'react-redux';
import { withModal } from '@ohif/ui';

import { createProto } from './createProtocol';
import { HangingProtocolDetailsModal } from './HangingProtocolDetailsModal';
import { LocalHangingProtocolListModal } from './ManagerLocalHangingProtocolList';

const {
  ProtocolEngine,
  ProtocolStore,
  LocalStorageProtocolStrategy,
} = hangingProtocols;

const { setLayout, setViewportSpecificData } = OHIF.redux.actions;

function AutoclosePopup({ children, close }) {
  const refContainer = React.useRef();
  React.useEffect(() => {
    const handleMouseClick = e => {
      if (!refContainer.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleMouseClick, false);
    return () => {
      document.removeEventListener('mousedown', handleMouseClick, false);
    };
  }, [close]);
  return <div ref={refContainer}>{children}</div>;
}

const deepClone = obj => JSON.parse(JSON.stringify(obj));

export const protocolStore = new ProtocolStore(
  new LocalStorageProtocolStrategy()
);

export function HangingProtocolButton({
  studies,
  setLayout,
  setViewportSpecificData,
  viewports,
  modal,
}) {
  const refProtocolEngine = React.useRef();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const initProtoEngine = () => {
      if (studies.length == 0) {
        refProtocolEngine.current = null;
        return;
      }

      if (refProtocolEngine.current) return;

      studies = studies.map(study => study.metadata);
      const protocolEngine = new ProtocolEngine(
        protocolStore,
        studies,
        [],
        new OHIF.classes.OHIFStudyMetadataSource(),
        {
          setLayout,
          setViewportSpecificData,
        }
      );

      refProtocolEngine.current = protocolEngine;
    };
    initProtoEngine();
  }, [studies]);

  const manageList = () => {
    modal.show({
      content: LocalHangingProtocolListModal,
      contentProps: { protocolStore },
      title: 'Local Hanging Protocols',
    });
  };

  const saveProto = proto => {
    protocolStore.addProtocol(proto);
    const protocolEngine = refProtocolEngine.current;
    protocolEngine.updateProtocolMatches();
  };

  const editProto = proto => {
    modal.show({
      content: HangingProtocolDetailsModal,
      contentProps: {
        proto,
        onSave: saveProto,
        stageNo: proto.stages.length - 1,
      },
      title: 'Hanging Protocol',
    });
  };

  const addProtocol = () => {
    let proto = createProto(viewports, studies);
    editProto(proto);
  };

  const addStage = () => {
    let proto = createProto(viewports, studies);
    let currentProto = deepClone(protocolEngine.protocol);
    currentProto.stages.push(proto.stages[0]);
    editProto(currentProto);
  };

  const applyProtocol = () => {
    const protocolEngine = refProtocolEngine.current;
    protocolEngine.nextProtocolStageCircular();
  };

  const toggleVisible = () => {
    if (!visible) {
      const protocolEngine = refProtocolEngine.current;
      protocolEngine.updateProtocolMatches();
    }
    setVisible(!visible);
  };

  const protocolEngine = refProtocolEngine.current;
  const protocols =
    protocolEngine && Array.from(protocolEngine.matchedProtocols.values());
  let stageCount = 0;
  protocols &&
    protocols.forEach(proto => {
      stageCount += proto.stages.length;
    });

  const currentProtocol = protocolEngine && protocolEngine.protocol;

  return (
    <div className="dd-menu">
      <ToolbarButton
        label={'Hanging Protocols'}
        icon="plus"
        onClick={toggleVisible}
      />
      {visible && (
        <div className="dd-menu-list" style={{ width: 200 }}>
          <AutoclosePopup close={() => setVisible(false)}>
            <button className="dd-item" onClick={addProtocol}>
              <span>Save as new protocol</span>
            </button>
            {stageCount > 0 && (
              <button className="dd-item" onClick={applyProtocol}>
                {// prettier-ignore
                currentProtocol
                  ? <span>Apply next ({stageCount})</span>
                  : <span>Apply ({stageCount})</span>}
              </button>
            )}

            {currentProtocol && (
              <button className="dd-item" onClick={addStage}>
                <span>Save as new stage in {currentProtocol.name}</span>
              </button>
            )}
            <button className="dd-item" onClick={manageList}>
              <span>Manage Local Protocols</span>
            </button>
          </AutoclosePopup>
        </div>
      )}
    </div>
  );
}

const mapStateToProps = state => {
  return {
    viewports: state.viewports,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLayout: layout => dispatch(setLayout(layout)),
    setViewportSpecificData: (viewportIndex, viewportSpecificData) =>
      dispatch(setViewportSpecificData(viewportIndex, viewportSpecificData)),
  };
};

export const ConnectedHangingProtocolButton = connect(
  mapStateToProps,
  mapDispatchToProps
)(withModal(HangingProtocolButton));
