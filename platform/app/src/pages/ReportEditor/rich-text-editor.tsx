// RichTextEditor.js
import React, { useRef, useEffect } from 'react';
import Quill from 'quill';

import 'quill/dist/quill.snow.css';
import { Button } from 'antd';

const RichTextEditor = ({ content, onChange, onSave, cancel }) => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  useEffect(() => {
    console.log("content", content);

    if (!quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
      });
    }

    quillInstance.current.on('text-change', (delta, oldDelta, source) => {
      // console.log("changed", quillInstance.current.root.innerHTML);

      // onChange && onChange(quillInstance.current.root.innerHTML);
    });

    quillInstance.current.on('text-change', () => {
      // console.log("changed", quillInstance.current.root.innerHTML);
      // onChange(quillInstance.current.root.innerHTML);
    });

    // if (content) {
    //   quill.root.innerHTML = content;
    // }

    // Convert HTML to Delta format
    const delta = quillInstance.current.clipboard.convert(content);

    console.log("delta", delta);


    // Load Delta into Quill
    quillInstance.current.setContents(delta);

    quillInstance.current.root.innerHTML = content;
  }, [content]);

  const handleSave = () => {
    onSave && onSave(quillInstance.current.root.innerHTML);
  }

  return (<div className='editor-container'><div ref={editorRef}></div>
    <div className='d-flex space-between' >
      <Button className='mt-3' type='default' onClick={cancel}>Cancel</Button>
      <Button danger className='mt-3' type='default' color='primary' onClick={handleSave}>Save Changes</Button>
    </div>
  </div>);
};

export default RichTextEditor;
