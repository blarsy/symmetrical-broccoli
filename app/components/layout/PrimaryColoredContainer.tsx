import React from "react"
import { primaryColor } from "./constants"
import Container from "./Container"

interface Props {
    children: JSX.Element
}

export default ({ children }: Props) => <Container style={{ backgroundColor: primaryColor }}>
    {children}
</Container>