import React, { useState } from "react";

import "./label.css";

const FloatLabel = props => {
  const [focus, setFocus] = useState(false);
  const { children, label, value } = props;

  const labelClass = focus || value ? "label label-float" : "label";

  return (
    <div
      className={`float-label ${props.className || ""}`}
      onBlur={() => setFocus(false)}
      onFocus={() => setFocus(true)}
    >
      {children}
      <label className={labelClass}>{label}</label>
    </div>
  );
};

export default FloatLabel;
