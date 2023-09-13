import React from 'react';

export const LinkComponent = ({ children, href, target: originalTarget, rel }) => {
  const onClick = event => {
    if (originalTarget) {
      return;
    }

    const target = document.querySelector(href);
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      target.scrollIntoView();
    }
  };
  return (
    <a
      className="text-blue-600"
      onClick={onClick}
      target={originalTarget}
      rel={rel}
      href={href}
    >
      {children}
    </a>
  );
};
