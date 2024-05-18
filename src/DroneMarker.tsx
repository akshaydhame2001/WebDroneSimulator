import React from "react"
import { Marker } from "react-map-gl"
import "./DroneMarker.scss"
import dronemarkerImg from "./icons/drone.png"

interface DroneMarkerProps {
  coordinate: [number, number]
  bearing: number
}

const DroneMarker: React.FC<DroneMarkerProps> = ({ coordinate, bearing }) => {
  const rotationStyle = {
    transform: `rotate(${bearing}deg)`,
  }

  return (
    <Marker longitude={coordinate[0]} latitude={coordinate[1]}>
      <div className="marker-container">
        <img
          className="marker"
          src={dronemarkerImg}
          style={rotationStyle}
          alt="Drone Marker"
        />
      </div>
    </Marker>
  )
}

export default DroneMarker
