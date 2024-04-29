import { Stack, Typography } from "@mui/material"
import { fonts } from "@/theme"
import { primaryColor } from "@/utils"

const Step3 = () => <Stack alignContent="center" maxWidth={540}>
    <Typography style={{ transform: 'rotate(-3.7deg)', margin: '0.5rem' }} lineHeight={1} textAlign="center" fontFamily={fonts.title.style.fontFamily} fontSize={43} color={primaryColor}>QU&rsquo;EST CE QU&rsquo;ON ENTEND PAR <Typography component="span" color="#000"fontFamily={fonts.title.style.fontFamily} lineHeight={1} fontSize={45}>RESSOURCES</Typography> ?</Typography>
    <Typography marginTop="3rem" color="#000">Il s&rsquo;agit de tout ce qui est n&eacute;cessaire au bon fonctionnement de ton activité. Parfois, il te manque un b&eacute;n&eacute;vole pour un &eacute;v&eacute;nement ou du mat&eacute;riel dans lequel tu ne peux pas investir ? L&rsquo;application propose des ressources tant <b>humaines, mat&eacute;rielles qu&rsquo;intellectuelles</b>.</Typography>
</Stack>

export default Step3