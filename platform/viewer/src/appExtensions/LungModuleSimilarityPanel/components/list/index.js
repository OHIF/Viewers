import styled from 'styled-components';
import React from 'react';

const primary = '#151A1F';
const secondary = '#000';
const tetiary = '#2C363F';

const ListItemContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  margin: 0;
  background-color: ${({ index, isSelected }) =>
    isSelected ? tetiary : index % 2 ? primary : secondary};
  cursor: pointer;
  &:hover {
    background: ${tetiary};
  }
`;

export const ListItem = ({
  title = 'Default Button Title',
  index = 0,
  onClick = val => console.log('default click event', val),
  isSelected = false,
}) => {
  return (
    <ListItemContainer
      index={index}
      isSelected={isSelected}
      onClick={() => onClick(title)}
    >
      {isSelected && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 10,
            background: '#fff',
            marginRight: 15,
          }}
        />
      )}
      <p
        style={{
          color: 'white',
          margin: 0,
          padding: 0,
          textAlign: 'left',
        }}
      >
        {title}
      </p>
    </ListItemContainer>
  );
};

const List = ({
  list = Array(10).fill('List item name'),
  onClick = val => console.log('default click event', val),
}) => {
  return (
    <div>
      {list.map((item, index) => {
        return (
          <ListItem
            index={index}
            title={`${item}`}
            onClick={() => onClick(i)}
          />
        );
      })}
    </div>
  );
};

export default List;
