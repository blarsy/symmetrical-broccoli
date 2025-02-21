import { Alert, CircularProgress, Stack, SxProps, Theme } from "@mui/material"
import { useContext, useEffect } from "react"
import { AppContext } from "./AppContextProvider"

export interface StateError extends Error {
    detail?: string
}

interface Props {
    loading: boolean,
    error?: StateError,
    children?: React.ReactNode,
    containerStyle?: SxProps<Theme>
}

function LoadedZone({ loading, error, children, containerStyle }: Props) {
    const appContext = useContext(AppContext)

    // useEffect(()=> {
    //     console.log('zone',appContext)
    // }, [])

    return <Stack sx={containerStyle || { flexDirection: 'column', justifyContent: 'center' }}>
        { loading && <Stack sx={{ flex: 1, alignItems: 'center', paddingTop: '2rem' }}>
            <CircularProgress color="primary" />
        </Stack> }
        { !loading && !error && children }
        { error && <Stack>
            <Alert severity="error">{error.message}</Alert>
        </Stack> }
    </Stack>
}

export default LoadedZone