/* eslint-disable react/prop-types */

import React from 'react';
import produce from 'immer';

export function HangingProtocolDetailsModal({
  hide,
  proto: initial,
  stageNo = 0,
  onSave,
}) {
  const [proto, setProto] = React.useState(() =>
    JSON.parse(JSON.stringify(initial))
  );
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

  return (
    <div>
      <div>
        <div>
          Protocol Name:{' '}
          <input value={proto.name} onChange={e => setName(e.target.value)} />
        </div>
        {stageNo == 0 && (
          <div>
            <div>Protocol Matching Rule</div>
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
      <div>
        Stage Name:{' '}
        <input
          value={stage.name}
          onChange={e => setStageName(e.target.value)}
        />
      </div>
      {viewports.map((viewport, index) => (
        <div key={index}>
          <div>Viewport #{index + 1}</div>
          <ViewportSetup
            viewport={viewport}
            onChange={viewport => onChange(index, viewport)}
          />
        </div>
      ))}
      <div>
        <button onClick={hide}>Close</button>
        <button
          onClick={() => {
            onSave(proto);
            hide();
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ViewportSetup({ viewport, onChange }) {
  const { seriesMatchingRules, imageMatchingRules } = viewport;
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
        <div>Series Matching Rule</div>
        {seriesMatchingRules.map((rule, index) => (
          <Rule
            key={rule.id}
            rule={rule}
            onChange={rule => _onChange('seriesMatchingRules', index, rule)}
          />
        ))}
      </div>
      <div>
        <div>Image Matching Rule</div>
        {imageMatchingRules.map((rule, index) => (
          <Rule
            key={rule.id}
            rule={rule}
            onChange={rule => _onChange('imageMatchingRules', index, rule)}
          />
        ))}
      </div>
    </div>
  );
}

function Rule({ rule, onChange }) {
  let { attribute, constraint } = rule;
  const _onChange = (type, val, index) => {
    let c = Object.entries(constraint);
    c[index][type] = val;
    onChange({ ...rule, constraint: Object.fromEntries(c) });
  };
  const onChangeOp = (op, index) => _onChange(0, op, index);
  const onChangeValue = (value, index) => _onChange(1, value, index);

  return Object.keys(constraint).map((op, index) => (
    <div
      style={{ display: 'flex', justifyContent: 'space-around' }}
      key={index}
    >
      <div style={{ width: 200 }}>{attribute}</div>
      <div>
        <SelectOpereator
          type={typeof constraint[op].value}
          value={op}
          onChange={op => onChangeOp(op, index)}
        />
      </div>
      <div>
        <input
          value={constraint[op].value}
          onChange={e => onChangeValue({ value: e.target.value }, index)}
        />
      </div>
      <div>
        <button onClick={() => onChange(null)}>X</button>
      </div>
    </div>
  ));
}

function SelectOpereator({ type, value, onChange }) {
  const options =
    type == 'number' ? ['equals', '<', '>'] : ['equals', 'contains'];
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {options.map(option => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
