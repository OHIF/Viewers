import React from "react";

export default function PanelClock({ servicesManager, commandsManager }) {
  const time = new Date();
  return (
    <div className="overflow-x-hidden overflow-y-auto text-white invisible-scrollbar">
      <div className="p-4">{time.toLocaleTimeString()}</div>
    </div>
  );
}
