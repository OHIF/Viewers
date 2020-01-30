import React, { useState } from 'react';

function Form({ children, initialState, onSubmit }) {
  const [state, setState] = useState({
    values: initialState,
    errors: {},
  });

  hasErrors = () => {
    return !!Object.keys(state.errors).length;
  };

  handleChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    event.persist();
    setState(prevState => ({
      values: {
        ...prevState.values,
        [name]: value,
      },
    }));
  };

  handleSubmit = event => {
    event.preventDefault();

    if (!hasErrors(state.errors)) {
      onSubmit(state.values);
    }
  };

  return children({
    ...state,
    handleSubmit,
    handleChange,
  });
}

export { Form };
