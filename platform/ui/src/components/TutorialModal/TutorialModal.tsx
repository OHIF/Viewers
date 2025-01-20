import React from "react";
// substitude with actual demo video in `platform\ui\assets\tutorialvideo`
import demoVideo from "../../../assets/tutorialvideo/demo.mp4";

// const videoStyle

const TutorialModal = () => {

  return (
    <div style={{ margin: "auto", width: "50%", objectFit: "contain" }}>
      <video controls style={{ objectFit: "contain" }}>
        <source src={demoVideo} type="video/mp4" />
      </video>
    </div>
  )
};

export default TutorialModal;
