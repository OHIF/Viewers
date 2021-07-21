import React from 'react';
import get from 'lodash.get';
import capitalize from 'capitalize';

import { humanize } from './humanize-prop';
import { Table } from './components/Table';
import { Tooltip } from './components/Tooltip';

const styles = {
  thead: {
    textAlign: 'left',
  },
};

export const getPropType = (prop, Tooltip) => {
  const propName = prop.flowType ? prop.flowType.name : prop.type.name;
  const isEnum = propName.startsWith('"') || propName === 'enum';
  const name = capitalize(isEnum ? 'enum' : propName);
  const value = prop.type && prop.type.value;

  if (!name) return null;

  if (
    !Tooltip ||
    (isEnum && typeof value === 'string') ||
    (!prop.flowType && !isEnum && !value) ||
    (prop.flowType && !prop.flowType.elements)
  ) {
    return name;
  }

  return prop.flowType ? (
    <Tooltip text={humanize(prop.flowType)}>{name}</Tooltip>
  ) : (
    <Tooltip text={humanize(prop.type)}>{name}</Tooltip>
  );
};

export const PropsTable = ({ props, ...rest }) => {
  if (!props || typeof props !== 'object') {
    throw new Error('invalid props passed to PropsTable');
  }

  const hasDescription = Object.keys(props).some(name => {
    const description = get(props, `${name}.description`);
    return Boolean(description) && Boolean(get(description, 'length'));
  });

  const Thead = 'thead';
  const Tr = 'tr';
  const Th = 'th';
  const Tbody = 'tbody';
  const Td = 'td';

  return (
    <Table {...rest}>
      <Thead style={styles.thead}>
        <Tr>
          <Th>Property</Th>
          <Th>Type</Th>
          <Th>Required</Th>
          <Th>Default</Th>

          {hasDescription && <Th width="40%">Description</Th>}
        </Tr>
      </Thead>

      <Tbody>
        {props &&
          Object.keys(props).map(name => {
            const prop = props[name];

            if (!prop.flowType && !prop.type) return null;
            return (
              <Tr key={name}>
                <Td>{name}</Td>
                <Td>{getPropType(prop, Tooltip)}</Td>
                <Td>{String(prop.required)}</Td>
                {!prop.defaultValue ? (
                  <Td>
                    <em>-</em>
                  </Td>
                ) : (
                  <Td>
                    {prop.defaultValue.value === "''" ? (
                      <em>[Empty String]</em>
                    ) : (
                      prop.defaultValue &&
                      prop.defaultValue.value.replace(/'/g, '')
                    )}
                  </Td>
                )}
                {hasDescription && (
                  <Td>{prop.description && prop.description}</Td>
                )}
              </Tr>
            );
          })}
      </Tbody>
    </Table>
  );
};
