import React from "react";
import RichTextEditor from "./rich-text-editor";

const ReportEditor = ({ cancel }) => {
  const [content, setContent] = React.useState("<h1>Hello Sandeep !</h1>");
  const handleContentChange = (newContent) => {
    // console.log("newContent", newContent);
    // setContent(newContent);
  }

  const onSave = (newContent) => {
    console.log("onsave newContent", newContent);
    setContent(newContent);
  }

  return (
    <div className="editor-container">
      <div>
        <RichTextEditor cancel={cancel} content={content} onSave={onSave} onChange={handleContentChange} />
      </div>
    </div>
  );
};

export default ReportEditor;