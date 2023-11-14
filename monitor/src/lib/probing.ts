import { SensorState } from "@/components/Sensor"
import axios from "axios"

export interface SensorProbeResult {
    state: SensorState,
    feedback: string
}

interface ProbeInfo {
    title: string,
    probe: () => Promise<SensorProbeResult>
}

export const makeHttpGetProbeInfo = (title: string, url: string): ProbeInfo => ({
    title, probe: async () => {
        try {
            const res = await axios.get(url)
            if(res.status === 200) {
              return { state: SensorState.good, feedback: '' }
            } else {
              return { state: SensorState.bad, feedback: `HTTP request status ${res.status}, ${res.statusText}` }
            }
        } catch(e) {
            return { state: SensorState.bad, feedback: (e as Error).message}
        }
      }
})

export const makeProbeInfo = (title: string, probe: () => Promise<SensorProbeResult>): ProbeInfo => {
    return {
        title, probe
    }
}