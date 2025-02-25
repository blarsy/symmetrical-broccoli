import { Typography } from "@mui/material"
import { PropsWithChildren } from "react"

export const ErrorText= (props: PropsWithChildren) => {
    return <Typography variant="body1" sx={{ color: 'red' }}>{props.children}</Typography>
}