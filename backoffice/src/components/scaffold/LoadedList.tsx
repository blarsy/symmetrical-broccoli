import { SxProps, Theme } from "@mui/material"
import LoadedZone from "./LoadedZone"
import { JSX, RefObject } from "react"

export interface StateError extends Error {
    detail?: string
}

interface Props {
    loading: boolean
    error?: StateError
    items: any[]
    renderItem: (item: any) => JSX.Element
    renderNoData?: () => JSX.Element
    containerStyle?: SxProps<Theme>
    onBottom?: () => void
    ref?: RefObject<HTMLDivElement | null>
    testID?: string
}

function LoadedList(p: Props) {
    return <LoadedZone testID={p.testID} ref={p.ref} onBottom={p.onBottom} loading={p.loading} error={p.error} containerStyle={p.containerStyle}>
        { p.items && p.items.length === 0 && p.renderNoData && p.renderNoData()}
        { p.items && p.items.length > 0 && p.items.map(p.renderItem) }
    </LoadedZone>
}

export default LoadedList