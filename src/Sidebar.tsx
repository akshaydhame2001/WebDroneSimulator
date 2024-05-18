import React from "react"
import ModeSwitch, { Option } from "./components/ModeSwitch.tsx"
import "./Sidebar.scss"

interface SidebarProps {
  core: {
    state: string
    rule: string
  }
  vehicle: {
    heading: number
    altitude: number
  }
  person: {
    local: {
      z: number
      x: number
    }
  }
  connected: boolean
}

const Sidebar: React.FC<SidebarProps> = ({
  core,
  vehicle,
  person,
  connected,
}) => {
  const altitude = vehicle?.altitude || 0
  const heading = vehicle?.heading || 0
  const state = core?.state || "UNKNOWN"
  const rule = core?.rule || "N/A"
  const linkState = connected ? "TRUE" : "FALSE"
  const personX = person?.local?.x.toFixed(2) || "?"
  const personZ = person?.local?.z.toFixed(2) || "?"

  const options: Option[] = [
    { title: "E2E", key: "e2e" },
    { title: "Manual", key: "manual" },
    { title: "Playback", key: "playback" },
  ]

  const handleModeChange = (key: string) => {
    // Logic to handle mode change
    console.log("Mode changed to:", key)
  }

  return (
    <div className="sidebar">
      <h2>Visualiser</h2>

      <div className="sidebar-data">
        <div className="sidebar-datum large">
          {state}
          <span>State</span>
        </div>

        <div className="sidebar-datum large">
          {rule}
          <span>Rule</span>
        </div>

        <div className="sidebar-datum">
          {linkState}
          <span>Link</span>
        </div>

        <div className="sidebar-datum">
          {altitude}m<span>Altitude</span>
        </div>

        <div className="sidebar-datum">
          {heading}deg
          <span>Heading</span>
        </div>
      </div>

      <div className="sidebar-data">
        <div className="sidebar-datum large">
          {personZ}m<span>Person Z</span>
        </div>

        <div className="sidebar-datum large">
          {personX}m<span>Person X</span>
        </div>
      </div>

      <ModeSwitch
        onChange={handleModeChange}
        options={options}
        defaultKey="e2e"
      />
    </div>
  )
}

export default Sidebar
