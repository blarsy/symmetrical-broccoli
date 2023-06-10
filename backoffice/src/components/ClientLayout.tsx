import { Typography, Container } from "@mui/material"

interface Props {
    title?: string,
    children: JSX.Element | '' | undefined
}

const ClientLayout = ({ title, children }: Props) => {
    return <Container sx={{ height: '100vh' }}>
        { title && <Typography variant="h1">{ title }</Typography> }
        { children }
    </Container>
}

export default ClientLayout