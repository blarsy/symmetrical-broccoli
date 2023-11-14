import { Card, CardContent, CircularProgress, IconButton, Stack, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import Circle from '@mui/icons-material/Circle'
import Refresh from '@mui/icons-material/Refresh'
import dayjs from "dayjs"
import { LoadingButton } from "@mui/lab"
import { SensorProbeResult } from "@/lib/probing"

interface Props {
    measureName: string,
    probe: () => Promise<SensorProbeResult>
}

export enum SensorState {
    unset,
    good,
    bad,
    warning
}

const colorFromState = (state: SensorState) => {
    switch(state) {
        case SensorState.bad: return 'error'
        case SensorState.good: return 'success'
        case SensorState.warning: return 'warning'
        case SensorState.unset: return 'disabled'
    }
}

const Sensor = ({ measureName, probe }: Props) => {
    const [state, setState] = useState({ state: SensorState.unset, latestProbe: null as Date | null, loading: false, error: '' })

    const callProbe = async () => {
        try {
            setState({ state: state.state, error: '', latestProbe: state.latestProbe, loading: true })
            const newState = await probe()
            setState({ state: newState.state, error: newState.feedback, latestProbe: new Date(), loading: false })
        } catch(e) {
            setState({ state: SensorState.unset, error: (e as Error).message, latestProbe: new Date(), loading: false })
        }
    }

    useEffect(() => {
        callProbe()
    }, [])

    return <Card sx={{ flex: 1 }}>
        <CardContent>
            <Typography variant="overline">{measureName}</Typography>
            <Stack direction="row" gap="2rem" alignItems="center">
                <Circle color={colorFromState(state.state)}/>
                <Stack>
                    {state.latestProbe ? dayjs(state.latestProbe).format('DD/MM/YYYY HH:mm:ss') : 'Pas encore connu'}
                    {state.error && <Typography color="error">{ state.error }</Typography>}
                </Stack>
                <LoadingButton variant="outlined" loading={state.loading} onClick={callProbe}><Refresh/></LoadingButton>
            </Stack>
        </CardContent>
    </Card>
}

export default Sensor