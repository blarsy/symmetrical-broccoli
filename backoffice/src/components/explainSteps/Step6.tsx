import { Stack } from "@mui/material"
import Wool from '@/app/img/LAINE.svg'

const Step6 = () => <Stack alignContent="stretch" maxHeight={500} sx={theme => ({
    [theme.breakpoints.up('lg')]: {
        padding: '3.5rem 0'
    }
})}>
    <Wool/>
</Stack>

export default Step6