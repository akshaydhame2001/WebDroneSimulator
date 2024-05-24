import React, { useEffect, useState, useRef } from "react"
import Map, { Marker, Source, Layer } from "react-map-gl"
import Sidebar from "./Sidebar"
import DroneMarker from "./DroneMarker"
import manager, { UpdateMessage } from "./lib/manager"
// import { useGamepads } from "react-gamepads"
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
  // const inputLoopRef = useRef<NodeJS.Timeout | null>(null)
  // const [gamepads, setGamepads] = useState<any>({})

  // useGamepads((gamepads: any) => setGamepads(gamepads))

  const clean = (map: any, layerName: string) => {
    if (map.getLayer(layerName)) {
      map.removeLayer(layerName)
    }
    if (map.getSource(layerName)) {
      map.removeSource(layerName)
    }
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

      updateTrack(
        [data.vehicle.coordinates.longitude, data.vehicle.coordinates.latitude],
        "drone"
      )

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

    const handleKeyPress = (e: KeyboardEvent) => {
      const INTERVAL = 50
      const SPEED = 1.5
      const MOVE_DISTANCE = SPEED * (INTERVAL / 1000)
      const EARTH = 6378137

      const [startLongitude, startLatitude] = personPosition
      let north = 0
      let east = 0

      switch (e.key) {
        case "ArrowUp":
          north = MOVE_DISTANCE
          break
        case "ArrowDown":
          north = -MOVE_DISTANCE
          break
        case "ArrowLeft":
          east = -MOVE_DISTANCE
          break
        case "ArrowRight":
          east = MOVE_DISTANCE
          break
        default:
          break
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
    }

    window.addEventListener("keydown", handleKeyPress)

    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [map, personPosition])

  // useEffect(() => {
  //   const INTERVAL = 50
  //   const SPEED = 1.5
  //   const MOVE_DISTANCE = SPEED * (INTERVAL / 1000)
  //   const EARTH = 6378137

  //   const updatePersonPosition = () => {
  //     const [startLongitude, startLatitude] = personPosition
  //     let north = 0
  //     let east = 0

  //     if (gamepads[0]) {
  //       const { buttons } = gamepads[0]
  //       if (buttons[12].pressed) {
  //         // DPAD_UP
  //         north = MOVE_DISTANCE
  //       } else if (buttons[13].pressed) {
  //         // DPAD_DOWN
  //         north = -MOVE_DISTANCE
  //       }
  //       if (buttons[14].pressed) {
  //         // DPAD_LEFT
  //         east = -MOVE_DISTANCE
  //       } else if (buttons[15].pressed) {
  //         // DPAD_RIGHT
  //         east = MOVE_DISTANCE
  //       }
  //     }

  //     if (north !== 0 || east !== 0) {
  //       const dLat = north / EARTH
  //       const dLon = east / (EARTH * Math.cos((Math.PI * startLatitude) / 180))

  //       const latOffset = startLatitude + dLat * (180 / Math.PI)
  //       const lonOffset = startLongitude + dLon * (180 / Math.PI)

  //       setPersonPosition([lonOffset, latOffset])

  //       manager.send({
  //         type: "control",
  //         latitude: latOffset,
  //         longitude: lonOffset,
  //       })
  //     }
  //   }

  //   if (!inputLoopRef.current) {
  //     inputLoopRef.current = setInterval(updatePersonPosition, INTERVAL)
  //   }

  //   return () => {
  //     if (inputLoopRef.current) {
  //       clearInterval(inputLoopRef.current)
  //       inputLoopRef.current = null
  //     }
  //   }
  // }, [gamepads, personPosition])

  const onMapLoaded = (event: any) => {
    setMap(event.target)
    prepareMap()
  }

  const prepareMap = () => {
    const newTracks = {
      drone: generateFeatureCollection(),
      person: generateFeatureCollection(),
    }
    setTracks(newTracks)

    if (map) {
      map.addSource("drone", { type: "geojson", data: newTracks.drone })
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

      map.addSource("person", { type: "geojson", data: newTracks.person })
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
      if (map && map.getSource(trackName)) {
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
        <Source id="drone" type="geojson" data={tracks.drone} />
        <Layer
          id="drone"
          type="line"
          source="drone"
          layout={{}}
          paint={{
            "line-color": "#FFD700",
            "line-opacity": 0.75,
            "line-width": 2,
          }}
        />
        <Source id="person" type="geojson" data={tracks.person} />
        <Layer
          id="person"
          type="line"
          source="person"
          layout={{}}
          paint={{
            "line-color": "#0000FF",
            "line-opacity": 0.75,
            "line-width": 2,
          }}
        />
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
