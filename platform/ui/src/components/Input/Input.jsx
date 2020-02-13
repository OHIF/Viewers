import React from 'react';
import Label from '../Label';

const Input = ({ label, ...rest }) => {
  return (
    <>
      <Label text="Label">
        <input
          className="transition duration-300 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          {...rest}
        />
      </Label>
    </>
  );
};

export default Input;
