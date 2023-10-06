import { Stack, Typography } from "@mui/material"
import { primaryColor } from "@/utils"
import { fonts } from "@/theme"

const Step5 = () => <Stack alignContent="center" maxWidth={685}>
    <Typography textAlign="center" style={{ transform: 'rotate(-3.7deg)' }} lineHeight={1} fontFamily={fonts.title.style.fontFamily} fontSize={48} color={primaryColor}>DANS LA VRAIE VIE,<br/>&Ccedil;A <Typography component="span" color="#000"fontFamily={fonts.title.style.fontFamily} lineHeight={1} fontSize={48}>DONNE &Ccedil;A.</Typography></Typography>
    <Typography marginTop="3rem" fontSize={21}>Une fois ton association inscrite sur l&rsquo;appli, tu peux <b>publier en un seul clic</b> (pour &ecirc;tre honn&ecirc;te, il en faut 3 mais c&rsquo;est plus chic de dire 1) les ressources que tu as &agrave; disposition pour que d&rsquo;autres associations puissent en profiter.&nbsp;</Typography>
</Stack>

export default Step5