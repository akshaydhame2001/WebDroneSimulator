import { useEffect } from "react"

export interface IncomingMessage {
  type: "reset" | "update"
}

export interface GeoLocation {
  latitude: number
  longitude: number
}

export interface ResetMessage extends IncomingMessage {
  type: "reset"
}

export interface UpdateMessage extends IncomingMessage {
  type: "update"
  vehicle: {
    heading: number
    coordinates: GeoLocation
  }
  core: {
    state: number
  }
  person?: {
    global: GeoLocation
    local: {
      z: number
      x: number
    }
  }
}

const EMPTY_MESSAGE = JSON.stringify({
  type: "none",
})

class Manager {
  private socket: WebSocket | null = null
  private changeCallback: ((data: UpdateMessage) => void) | null = null
  private resetCallback: ((data: ResetMessage) => void) | null = null
  private connectionCallback: ((connected: boolean) => void) | null = null

  private pendingMessages: string[] = []

  constructor() {
    this.connect()
  }

  private connect() {
    console.log("Connecting socket...")
    this.socket = new WebSocket("ws://172.25.16.1:5760/")

    this.socket.onopen = () => {
      if (this.connectionCallback) {
        this.connectionCallback(true)
      }
    }

    this.socket.onmessage = (event) => {
      this.onWebsocketMessage(event.data)
    }

    this.socket.onclose = () => {
      if (this.connectionCallback) {
        this.connectionCallback(false)
      }
      setTimeout(() => {
        this.connect()
      }, 1000)
    }

    this.socket.onerror = () => {
      if (this.socket) {
        this.socket.close()
      }
    }
  }

  private onWebsocketMessage(data: string) {
    try {
      const messages = data.split("\n")

      messages.forEach((data: string) => {
        const message: IncomingMessage = JSON.parse(data)

        if (message.type === "update" && this.changeCallback) {
          this.changeCallback(message as UpdateMessage)
        } else if (message.type === "reset" && this.resetCallback) {
          this.resetCallback(message as ResetMessage)
        }
      })

      // Send any pending messages (even if none)
      const outgoing =
        this.pendingMessages.length > 0
          ? this.pendingMessages.join("\n")
          : EMPTY_MESSAGE
      if (this.socket) {
        this.socket.send(outgoing)
      }

      this.pendingMessages = []
    } catch (e) {
      console.error(data, e)
    }
  }

  public send(object: any): void {
    this.pendingMessages.push(JSON.stringify(object))
  }

  public set onchange(fn: (data: UpdateMessage) => void) {
    this.changeCallback = fn
  }

  public set onreset(fn: (data: ResetMessage) => void) {
    this.resetCallback = fn
  }

  public set onconnected(fn: (connected: boolean) => void) {
    this.connectionCallback = fn
  }

  public cleanup() {
    if (this.socket) {
      this.socket.close()
    }
  }
}

const manager = new Manager()

// Hook to cleanup WebSocket connection on component unmount
export const useCleanupWebSocket = () => {
  useEffect(() => {
    return () => {
      manager.cleanup()
    }
  }, [])
}

export default manager
