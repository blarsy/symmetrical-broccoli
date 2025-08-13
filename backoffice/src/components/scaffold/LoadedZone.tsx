import { Alert, CircularProgress, Stack, SxProps, Theme } from "@mui/material"
import Feedback from "./Feedback"
import { RefObject, useEffect, useRef } from "react"
import { p } from "graphql-ws/dist/common-DY-PBNYy"

export interface StateError extends Error {
    detail?: string
}

interface Props {
    loading: boolean,
    error?: StateError,
    children?: React.ReactNode,
    containerStyle?: SxProps<Theme>
    onBottom?: () => void
    ref?: RefObject<HTMLDivElement>
    testID?: string
}

const isBottom = (el: Element) => {
    console.log('Math.abs(el.scrollHeight - (el.scrollTop + el.clientHeight)) <= 30', el.scrollHeight, el.scrollTop, el.clientHeight, Math.abs(el.scrollHeight - (el.scrollTop + el.clientHeight)))
    return Math.abs(el.scrollHeight - (el.scrollTop + el.clientHeight)) <= 30
}

function LoadedZone({ loading, error, children, containerStyle, onBottom, ref, testID }: Props) {
    return <Stack data-testid={testID} ref={ref} sx={containerStyle || { flexDirection: 'column', justifyContent: 'center' }} onScroll={e => {
        console.log('onBottom', onBottom)
        if(onBottom && isBottom(e.currentTarget)) {
            onBottom()
        } 
    }}>
        { loading && <Stack data-testid={`${testID}:Loading`} sx={{ flex: 1, alignItems: 'center', paddingTop: '2rem' }}>
            <CircularProgress color="primary" />
        </Stack> }
        { !loading && !error && children }
        <Feedback visible={!!error} severity="error" detail={error?.message} />
    </Stack>
}

export default LoadedZone