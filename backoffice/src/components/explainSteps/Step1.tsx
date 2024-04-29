import { Box, Stack, Typography } from "@mui/material"
import Motto from '@/app/img/TROCLA.svg'
import { primaryColor } from "@/utils"
import { fonts } from "@/theme"

const Step1 = () => <Stack maxWidth={1100} display="flex" justifyContent="center" sx={theme => ({
    flexDirection: 'row',
    [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        padding: '2rem 0',
        alignItems: 'center'
    }
})}>
    <Box sx={{ maxHeight: '347px',
        flex: '1 0 50%' }}>
        <Motto width="100%" height="100%"/>
    </Box>
    <Stack justifyContent="center">
        <Box>
            <Typography paddingRight="2rem" component="span" fontFamily={fonts.title.style.fontFamily} color={primaryColor}>Troc</Typography>
            <Typography color="#000" component="span">Tu as du mat&eacute;riel dont tu n&apos;as plus besoin ? Tu peux le proposer au troc sur l&apos;application. Cela permet &agrave; d&apos;autres toppeurs de <b>l&apos;emprunter ou de l&apos;utiliser</b> temporairement, tout en te permettant de r&eacute;cup&eacute;rer des ressources dont tu as besoin.</Typography>
        </Box>
        <Box>
            <Typography paddingRight="2rem" component="span" fontFamily={fonts.title.style.fontFamily} color={primaryColor}>Donne</Typography>
            <Typography color="#000" component="span">Si tu es pr&ecirc;t &agrave; faire don de ressources sans attendre quoi que ce soit en retour (parce que tu es une personne m&eacute;ga sympa), utilise la fonction &quot;Don&quot; pour <b>partager</b> ta g&eacute;n&eacute;rosit&eacute;. C&apos;est une mani&egrave;re simple et efficace d&apos;aider d&apos;autres toppeurs dans le besoin.</Typography>
        </Box>
        <Box>
            <Typography paddingRight="2rem" component="span" fontFamily={fonts.title.style.fontFamily} color={primaryColor}>Tope</Typography>
            <Typography color="#000" component="span">Le tope, c&apos;est notre mani&egrave;re de dire &quot;youpi, on a trouv&eacute; bonheur&quot;. <b>Allez, tope-l&agrave; !</b></Typography>
        </Box>
    </Stack>
</Stack>

export default Step1