import { Stack, Typography } from "@mui/material"
import PaintBucket from '@/app/img/POT DE PEINTURE.svg'

const Step4 = () => <Stack alignContent="stretch" maxHeight={500} sx={theme => ({
    [theme.breakpoints.up('lg')]: {
        padding: '3.5rem 0'
    }
})}>
    <PaintBucket />
</Stack>

export default Step4