import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { CinePlayer } from '@ohif/ui'

export default function IFrame({ children }) {
  const [ref, setRef] = useState();
  const container = ref?.contentWindow?.document?.body;

  // document.head.innerHTML
  console.log(document.head.innerHTML)

  const renderHead = () => {
    return (
      <React.Fragment>
          <style dangerouslySetInnerHTML={{__html: `
            .CinePlayer { background-color: red }
          `}} />
      </React.Fragment>
    )
  }

  const styledChildren = (<>
    {renderHead()}
    {children}
  </>)

  return (
    <iframe ref={setRef}>
      {container && createPortal(styledChildren, container)}
    </iframe>
  );
}
