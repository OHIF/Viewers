import React, { useState } from 'react';
import { EditorState, ContentState, Modifier, RichUtils } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const WysigEditor = ({ content, onChange, onSave, cancel }) => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  const handleTableButtonClick = () => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('TABLE', 'IMMUTABLE', { rows: 3, cols: 3 });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(
      editorState,
      { currentContent: contentStateWithEntity },
      'create-table'
    );
    setEditorState(RichUtils.toggleLink(newEditorState, newEditorState.getSelection(), entityKey));
  };

  const toolbarOptions = {
    options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'image', 'remove', 'history'],
    inline: {
      options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace']
    },
    list: {
      options: ['unordered', 'ordered']
    },
    textAlign: {
      options: ['left', 'center', 'right']
    },
    table: {
      icon: <div style={{ marginLeft: 10 }}>Insert Table</div>,
      onClick: handleTableButtonClick
    }
  };

  const handleChange = (newEditorState) => {
    setEditorState(newEditorState);
  };
  return (
    <div>
      <Editor
        editorState={editorState}
        onEditorStateChange={handleChange}
        toolbar={toolbarOptions}
      />
    </div>
  )
}

export default WysigEditor;
