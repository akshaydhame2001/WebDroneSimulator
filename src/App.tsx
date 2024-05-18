import React, { useEffect, useState, useRef } from "react"
import Map, { Marker } from "react-map-gl"
import Sidebar from "./Sidebar"
import DroneMarker from "./DroneMarker"
import manager, { UpdateMessage } from "./lib/manager"
import { ResponsiveGamepad } from "responsive-gamepad"
import "./App.scss"
import personimg from "./icons/person.png"

const App: React.FC = () => {
  const [position, setPosition] = useState<[number, number]>([
    149.16523, -35.363261,
  ])
  const [heading, setHeading] = useState(0)
  const [personPosition, setPersonPosition] = useState<[number, number]>([
    149.16523, -35.363203,
  ])
  const [map, setMap] = useState<any>(null)
  const [tracks, setTracks] = useState<any>({ drone: null, person: null })
  const [core, setCore] = useState<any>({})
  const [vehicle, setVehicle] = useState<any>({})
  const [person, setPerson] = useState<any>({})
  const [connected, setConnected] = useState(false)
  const inputLoopRef = useRef<NodeJS.Timeout | null>(null)

  const clean = (map: any, layerName: string) => {
    map.removeLayer(layerName)
    map.removeSource(layerName)
  }

  useEffect(() => {
    manager.onconnected = (data: boolean) => {
      setConnected(data)
    }

    manager.onchange = (data: UpdateMessage) => {
      setPosition([
        data.vehicle.coordinates.longitude,
        data.vehicle.coordinates.latitude,
      ])
      setHeading(data.vehicle.heading)
      setCore(data.core)
      setVehicle(data.vehicle)

      if (data.person) {
        setPerson(data.person)
        updateTrack(
          [data.person.global.longitude, data.person.global.latitude],
          "person"
        )
      } else {
        setPerson({})
      }
    }

    manager.onreset = () => {
      setPosition([149.16523, -35.363261])
      setPersonPosition([149.16523, -35.363203])
      setHeading(0)

      if (map) {
        clean(map, "drone")
        clean(map, "person")
      }

      prepareMap()
    }

    ResponsiveGamepad.enable()
    startInputTracking()

    return () => {
      if (inputLoopRef.current) {
        clearInterval(inputLoopRef.current)
      }
    }
  }, [map])

  const startInputTracking = () => {
    const INTERVAL = 50
    const SPEED = 1.5
    const MOVE_DISTANCE = SPEED * (INTERVAL / 1000)
    const EARTH = 6378137

    inputLoopRef.current = setInterval(() => {
      const { DPAD_UP, DPAD_DOWN, DPAD_LEFT, DPAD_RIGHT } =
        ResponsiveGamepad.getState()
      const [startLongitude, startLatitude] = personPosition

      let north = 0
      let east = 0

      if (DPAD_UP && !DPAD_DOWN) {
        north = MOVE_DISTANCE
      } else if (!DPAD_UP && DPAD_DOWN) {
        north = -MOVE_DISTANCE
      }

      if (DPAD_LEFT && !DPAD_RIGHT) {
        east = -MOVE_DISTANCE
      } else if (!DPAD_LEFT && DPAD_RIGHT) {
        east = MOVE_DISTANCE
      }

      const dLat = north / EARTH
      const dLon = east / (EARTH * Math.cos((Math.PI * startLatitude) / 180))

      const latOffset = startLatitude + dLat * (180 / Math.PI)
      const lonOffset = startLongitude + dLon * (180 / Math.PI)

      setPersonPosition([lonOffset, latOffset])

      manager.send({
        type: "control",
        latitude: latOffset,
        longitude: lonOffset,
      })
    }, INTERVAL)
  }

  const onMapLoaded = (event: any) => {
    setMap(event.target)
    prepareMap()
  }

  const prepareMap = () => {
    setTracks({
      drone: generateFeatureCollection(),
      person: generateFeatureCollection(),
    })

    if (map) {
      map.addSource("drone", { type: "geojson", data: tracks.drone })
      map.addLayer({
        id: "drone",
        type: "line",
        source: "drone",
        paint: {
          "line-color": "yellow",
          "line-opacity": 0.75,
          "line-width": 2,
        },
      })

      map.addSource("person", { type: "geojson", data: tracks.person })
      map.addLayer({
        id: "person",
        type: "line",
        source: "person",
        paint: {
          "line-color": "blue",
          "line-opacity": 0.75,
          "line-width": 2,
        },
      })
    }
  }

  const generateFeatureCollection = () => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      ],
    }
  }

  const updateTrack = (coord: [number, number], trackName: string) => {
    const trackData = tracks[trackName]
    if (trackData) {
      trackData.features[0].geometry.coordinates.push(coord)
      if (map) {
        map.getSource(trackName).setData(trackData)
      }
    }
  }

  return (
    <div id="app">
      <Sidebar
        core={core}
        vehicle={vehicle}
        connected={connected}
        person={person}
      />
      <Map
        initialViewState={{
          longitude: position[0],
          latitude: position[1],
          zoom: 18,
        }}
        style={{ width: "100%", height: "100vh" }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken="pk.eyJ1IjoiYWtzaGF5ZGhhbWUyMDAxIiwiYSI6ImNsbnNlMjFoeTEwYjAyam16Z2ZpZ2ZuN28ifQ.-znQIL14sA3qc4daXg9T7Q"
        onLoad={onMapLoaded}
        dragRotate={false}
        touchZoomRotate={false}
      >
        <Marker longitude={position[0]} latitude={position[1]} anchor="center">
          <DroneMarker coordinate={position} bearing={heading} />
        </Marker>
        <Marker
          longitude={personPosition[0]}
          latitude={personPosition[1]}
          anchor="center"
        >
          <img className="person-marker" src={personimg} alt="Person" />
        </Marker>
      </Map>
    </div>
  )
}

export default App
