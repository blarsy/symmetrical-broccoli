import { Typography, Stack, SxProps, Theme } from "@mui/material"
import { useContext } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { SearchParameters } from "./SearchFilter"
import OptionLine from "../form/OptionLine"

interface Props {
    searchParameters: SearchParameters
    onChange: (newValue:  {[name: string]: boolean}) => void
    sx?: SxProps<Theme>
}

const ResourceAttributesFilter = (p: Props) => {
    const appContext = useContext(AppContext)
    const t = appContext.i18n.translator

    return <Stack sx={p.sx}>
        <Typography variant="h4" textAlign="center" color="primary">{appContext.i18n.translator('filtersTitle')}</Typography>
        <OptionLine label={t('natureOptionsLabel')} values={{ 'isProduct': p.searchParameters.isProduct, isService: p.searchParameters.isService }} onChange={ p.onChange }/>
        <OptionLine label={t('exchangeTypeOptionsLabel')} values={{ 'canBeGifted': p.searchParameters.canBeGifted, 'canBeExchanged': p.searchParameters.canBeExchanged }} onChange={ p.onChange }/>
        <OptionLine label={t('deliveryOptionsLabel')} values={{ 'canBeTakenAway': p.searchParameters.canBeTakenAway, 'canBeDelivered': p.searchParameters.canBeDelivered }} onChange={ p.onChange }/>
    </Stack>
} 

export default ResourceAttributesFilter