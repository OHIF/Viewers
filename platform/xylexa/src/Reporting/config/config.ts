export const config = {
  readonly: false, // all options from https://xdsoft.net/jodit/doc/,
  buttons: [
    'bold',
    'italic',
    'underline',
    'lineHeight',
    'brush',
    'undo',
    'redo',
    '|',
    'outdent',
    'indent',
    '|',
    'align',
    'ul',
    'ol',
    'hr',
    '|',
    'font',
    'fontsize',
    'paragraph',
    'insertDate',
    '|',
    'table',
    '|',
    'image',
    'find',
    'print',
  ],

  controls: {
    insertDate: {
      name: 'Date',
      iconURL: '../../../public/assets/datePicker.svg',
      exec: function (editor) {
        editor.s.insertHTML(new Date().toDateString());
      },
    },
  },
};
