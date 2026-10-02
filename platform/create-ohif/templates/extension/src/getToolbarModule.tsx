/**
 * Toolbar module entries are EVALUATORS, not buttons: buttons are declared by
 * modes (toolbarService.addButtons) and reference an evaluator by name to
 * compute their disabled/active state each render cycle. Custom toolbar
 * button components can also be registered here.
 */
export default function getToolbarModule({ servicesManager, commandsManager }) {
  return [
    {
      name: 'evaluate.{{dirName}}.example',
      evaluate: () => ({ disabled: false, className: '' }),
    },
  ];
}
