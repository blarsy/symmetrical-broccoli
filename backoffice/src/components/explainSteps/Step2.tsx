import { Stack } from "@mui/material"
import Shovel from '@/app/img/PELLE.svg'

const Step2 = () => <Stack flex="1" alignContent="stretch" maxHeight={500} sx={theme => ({
    [theme.breakpoints.up('md')]: {
        padding: '3.5rem 0'
    }
})}>
    <Shovel/>
</Stack>

export default Step2