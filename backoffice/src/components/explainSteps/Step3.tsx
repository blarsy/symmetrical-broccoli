import { Stack, Typography } from "@mui/material"
import { fonts } from "@/theme"
import { primaryColor } from "@/utils"

const Step3 = () => <Stack alignContent="center" maxWidth={540}>
    <Typography style={{ transform: 'rotate(-3.7deg)' }} lineHeight={1} fontFamily={fonts.title.style.fontFamily} fontSize={48} color={primaryColor}>QU&rsquo;EST CE QU&rsquo;ON ENTEND PAR <Typography component="span" color="#000"fontFamily={fonts.title.style.fontFamily} lineHeight={1} fontSize={48}>RESSOURCES</Typography> ?</Typography>
    <Typography marginTop="3rem" fontSize={21}>Il s&rsquo;agit de tout ce qui est n&eacute;cessaire au bon fonctionnement de ton asso. Parfois, il te manque un b&eacute;n&eacute;vole pour un &eacute;v&eacute;nement ou du mat&eacute;riel dans lequel tu ne peux pas investir ? L&rsquo;application propose des ressources tant humaines, mat&eacute;rielles qu&rsquo;intellectuelles.</Typography>
</Stack>

export default Step3