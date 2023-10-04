import React from 'react';

export function createComponentTemplate(ComponentClass) {
  return args => <ComponentClass {...args} />;
}

// const allowedIcons = iconsMetaData.reduce(
//   (acc, icon) => {
//     const Component = AllIcons[icon.file.split(".")[0]];
//     acc.options.push(icon.name);
//     acc.mapping[icon.name] = Component;

//     return acc;
//   },
//   { options: [], mapping: {} }
// );

export function createStoryMetaSettings({ component, enumPropNamesArray, iconPropNamesArray }) {
  const argTypes = {};

  // set enum allowed values inside argsTypes object
  enumPropNamesArray?.forEach(propName => {
    const enums = component[`${propName}s`];
    if (enums && enums instanceof Object) {
      argTypes[propName] = {
        options: Object.values(enums),
      };
    }
  });

  if (component === Avatar) {
    console.log(argTypes);
  }

  // set icon allowed values inside argsTypes object
  iconPropNamesArray?.forEach(propName => {
    argTypes[propName] = {
      options: allowedIcons.options,
      mapping: allowedIcons.mapping,
      control: {
        type: 'select',
      },
    };
  });

  return argTypes;
}
