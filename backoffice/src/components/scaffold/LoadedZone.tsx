import { Alert, CircularProgress, Stack, SxProps, Theme } from "@mui/material"

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
        { loading && <CircularProgress /> }
        { !loading && !error && children }
        { error && <Stack>
            <Alert severity="error">{error.message}</Alert>
        </Stack> }
    </Stack>
}

export default LoadedZone