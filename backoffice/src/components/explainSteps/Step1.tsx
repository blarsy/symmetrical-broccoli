import { Box, Stack, Typography } from "@mui/material"
import Motto from '@/app/img/TROCLA.svg'
import { primaryColor } from "@/utils"
import { fonts } from "@/theme"

const contents = [{
    title: 'Troc',
    text: `Tu as du matériel dont tu n'as plus besoin ? Tu peux le proposer au troc sur l'application. Cela permet à d'autres associations de l'emprunter ou de l'utiliser temporairement, tout en vous permettant de récupérer des ressources dont tu as besoin.`
},{
    title: 'Donne',
    text: `Si tu es prêt à faire don de ressources sans attendre quoi que ce soit en retour (parce que tu es une personne méga sympa), utilise la fonction "Donne" pour partager ta générosité. C'est une manière simple et efficace d'aider d'autres associations dans le besoin.`
},{
    title: 'Tope',
    text: `Le tope, c'est notre manière de dire "youpi, on a trouvé bonheur". Allez, tope-là !`
}]

const Step1 = () => <Stack maxWidth={1100} gap="50px" display="flex" justifyContent="center" sx={theme => ({
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
        {contents.map((content, idx) => {
            return <Box key={idx}>
                <Typography paddingRight="2rem" component="span" fontFamily={fonts.title.style.fontFamily} color={primaryColor}>{content.title}</Typography>
                <Typography component="span">{content.text}</Typography>
            </Box>
        })}
    </Stack>
</Stack>

export default Step1