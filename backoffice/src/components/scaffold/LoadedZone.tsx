import { Alert, CircularProgress, Stack, SxProps, Theme } from "@mui/material"
import Feedback from "./Feedback"

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
    return <Stack sx={containerStyle || { flexDirection: 'column', justifyContent: 'center' }}>
        { loading && <Stack sx={{ flex: 1, alignItems: 'center', paddingTop: '2rem' }}>
            <CircularProgress color="primary" />
        </Stack> }
        { !loading && !error && children }
        <Feedback visible={!!error} severity="error" detail={error?.message} />
    </Stack>
}

export default LoadedZone