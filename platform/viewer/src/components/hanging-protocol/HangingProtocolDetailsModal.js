/* eslint-disable react/prop-types */

import React from 'react';
import produce from 'immer';
import { Checkbox, TabComponents } from '@ohif/ui';

const selectEnabledRules = rules => {
  return rules.map(selectEnabledConstraints).filter(r => !!r);
};
const selectEnabledConstraints = rule => {
  const constraints = Object.entries(rule.constraint)
    .filter(([op, { value, enabled }]) => enabled)
    .map(([op, { value, enabled }]) => [op, { value }]);
  if (constraints.length == 0) return null;
  return { ...rule, constraint: Object.fromEntries(constraints) };
};

function ProtocolDetails({
  name,
  protocolMatchingRules,
  setName,
  onChangeRule,
}) {
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div style={{ margin: 5 }}>Protocol Name</div>
        <div style={{ margin: 5 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="preferencesInput"
          />
        </div>
      </div>
      {protocolMatchingRules && (
        <div>
          <h3>Protocol Matching Rule</h3>
          {protocolMatchingRules.map((rule, index) => (
            <Rule
              key={rule.id}
              rule={rule}
              onChange={rule => onChangeRule(index, rule)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StageDetails({ name, layout, setStageName }) {
  return (
    <div>
      <h3>Stage</h3>
      <div style={{ display: 'flex' }}>
        <div style={{ margin: 5 }}>Name</div>
        <div style={{ margin: 5 }}>
          <input
            className="preferencesInput"
            value={name}
            onChange={e => setStageName(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ margin: 5 }}>Layout</div>
        <div style={{ margin: 5 }}>
          {layout.Rows} x {layout.Columns}
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ margin: 5 }}>Viewports</div>
        <div style={{ margin: 5 }}>{layout.Rows * layout.Columns}</div>
      </div>
    </div>
  );
}

const cloneProto = proto => {
  const enableRule = rule => {
    let constraintsArray = Object.entries(
      rule.constraint
    ).map(([op, { value, enabled }]) => ({ op, value, enabled }));
    constraintsArray.forEach(c => (c.enabled = true));
    constraintsArray = constraintsArray.map(({ op, value, enabled }) => [
      op,
      { value, enabled },
    ]);
    return { ...rule, constraint: Object.fromEntries(constraintsArray) };
  };

  const allRulesEnabled = rules => rules.map(enableRule);
  const instanceUIRuleEnabled = rules =>
    rules.map(rule =>
      rule.attribute.endsWith('InstanceUID') ? enableRule(rule) : rule
    );

  proto = JSON.parse(JSON.stringify(proto));
  if (proto.stages.length > 1) {
    proto.protocolMatchingRules = allRulesEnabled(proto.protocolMatchingRules);
  }

  proto.protocolMatchingRules = instanceUIRuleEnabled(
    proto.protocolMatchingRules
  );

  proto.stages[proto.stages.length - 1].viewports.forEach(viewport => {
    viewport.seriesMatchingRules = instanceUIRuleEnabled(
      viewport.seriesMatchingRules
    );
    viewport.imageMatchingRules = instanceUIRuleEnabled(
      viewport.imageMatchingRules
    );
  });

  return proto;
};

export function HangingProtocolDetailsModal({
  hide,
  proto: initial,
  stageNo = 0,
  onSave,
}) {
  const [proto, setProto] = React.useState(() => cloneProto(initial));
  const { protocolMatchingRules } = proto;
  const stage = proto.stages[stageNo];
  const { viewportStructure, viewports } = stage;
  const onChange = (index, viewport) => {
    let modified = produce(proto, draft => {
      draft.stages[0].viewports[index] = viewport;
    });
    setProto(modified);
  };

  const onChangeRule = (index, rule) => {
    let modified = produce(proto, draft => {
      if (rule) {
        draft.protocolMatchingRules[index] = rule;
      } else {
        draft.protocolMatchingRules.splice(index, 1);
      }
    });
    setProto(modified);
  };

  const setName = name =>
    setProto(
      produce(proto, proto => {
        proto.name = name;
      })
    );
  const setStageName = name =>
    setProto(
      produce(proto, proto => {
        proto.stages[stageNo].name = name;
      })
    );

  const onlyEnabled = proto =>
    produce(proto, proto => {
      proto.protocolMatchingRules = selectEnabledRules(
        proto.protocolMatchingRules
      );
      proto.stages[stageNo].viewports.forEach(viewport => {
        viewport.seriesMatchingRules = selectEnabledRules(
          viewport.seriesMatchingRules
        );
        viewport.imageMatchingRules = selectEnabledRules(
          viewport.imageMatchingRules
        );
      });
    });

  const tabs = [
    {
      name: 'Protocol',
      Component: ProtocolDetails,
      customProps: {
        name: proto.name,
        protocolMatchingRules: protocolMatchingRules,
        setName,
        onChangeRule,
      },
    },
    {
      name: 'Stage',
      Component: StageDetails,
      customProps: {
        name: stage.name,
        layout: viewportStructure.properties,
        setStageName,
      },
    },
  ];
  viewports.forEach((viewport, index) => {
    tabs.push({
      name: 'Viewport #' + (index + 1),
      Component: ViewportSetup,
      customProps: {
        viewport,
        onChange: viewport => onChange(index, viewport),
      },
    });
  });

  return (
    <div>
      <TabComponents tabs={tabs} />
      <div className="footer">
        <div></div>
        <div>
          <button onClick={hide} className="btn btn-default">
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onSave(onlyEnabled(proto));
              hide();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewportSetup({ viewport, onChange }) {
  const {
    seriesMatchingRules,
    imageMatchingRules,
    viewportSettings,
  } = viewport;
  const _onChange = (type, index, rule) => {
    let modified = produce(viewport, draft => {
      if (rule) {
        draft[type][index] = rule;
      } else {
        draft[type].splice(index, 1);
      }
    });
    onChange(modified);
  };
  return (
    <div>
      <div>
        <h4>Series Matching Rule</h4>
        {seriesMatchingRules.map((rule, index) => (
          <Rule
            key={rule.id}
            rule={rule}
            onChange={rule => _onChange('seriesMatchingRules', index, rule)}
          />
        ))}
      </div>
      <div>
        <h4>Image Matching Rule</h4>
        {imageMatchingRules.map((rule, index) => (
          <Rule
            key={rule.id}
            rule={rule}
            onChange={rule => _onChange('imageMatchingRules', index, rule)}
          />
        ))}
      </div>
      <div>
        <pre>{JSON.stringify(viewportSettings, null, 4)}</pre>
      </div>
    </div>
  );
}

function Rule({ rule, onChange }) {
  let { attribute, constraint } = rule;
  let constraintsArray = Object.entries(
    constraint
  ).map(([op, { value, enabled }]) => ({ op, value, enabled }));

  const _onChange = (type, value, index) => {
    constraintsArray[index][type] = value;
    constraintsArray = constraintsArray.map(({ op, value, enabled }) => [
      op,
      { value, enabled },
    ]);
    onChange({ ...rule, constraint: Object.fromEntries(constraintsArray) });
  };

  return constraintsArray.map((constraint, index) => (
    <div style={{ display: 'flex' }} key={index}>
      <div style={{ width: 200, textAlign: 'right', margin: 5 }}>
        {attribute}
      </div>
      <div style={{ margin: 5, width: 100 }}>
        <SelectOpereator
          type={typeof constraint.value}
          value={constraint.op}
          onChange={op => _onChange('op', op, index)}
        />
      </div>
      <div style={{ margin: 5, width: 100 }}>
        <input
          className={'preferencesInput'}
          style={{ width: '100%' }}
          value={constraint.value}
          onChange={e => _onChange('value', e.target.value, index)}
        />
      </div>
      <div>
        <input
          type="checkbox"
          checked={constraint.enabled}
          onChange={e => _onChange('enabled', e.target.checked, index)}
        />
      </div>
    </div>
  ));
}

function SelectOpereator({ type, value, onChange }) {
  const options =
    type == 'number' ? ['equals', '<', '>'] : ['equals', 'contains'];
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%' }}
    >
      {options.map(option => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
