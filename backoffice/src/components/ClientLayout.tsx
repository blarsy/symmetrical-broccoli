import { Typography, Container, Box } from "@mui/material"
import Footer from '@/app/Footer'
import ClientWrapper from "./ClientWrapper"

interface Props {
    title?: string,
    children: JSX.Element | '' | undefined,
    version?: string
}

const ClientLayout = ({ title, children, version }: Props) => <ClientWrapper version={version}>
    <Container sx={{ height: '100vh', display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
        <Box display="flex" flexDirection="column" flex="1" justifyContent="flex-start">
            <Box display="flex" flexDirection="column" justifyContent="space-between" flex="1">
                <Box display="flex" flexDirection="column" alignItems="center">
                    { title && <Typography textAlign="center" variant="h1">{ title }</Typography> }
                    { children }
                </Box>
                <Footer />
            </Box>
        </Box>
    </Container>
</ClientWrapper>

export default ClientLayout