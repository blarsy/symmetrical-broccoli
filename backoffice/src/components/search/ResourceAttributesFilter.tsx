import { Typography, Stack, SxProps, Theme } from "@mui/material"
import { useContext } from "react"
import { SearchParameters } from "./SearchFilter"
import OptionLine from "../form/OptionLine"
import { UiContext } from "../scaffold/UiContextProvider"

interface Props {
    searchParameters: SearchParameters
    onChange: (newValue:  {[name: string]: boolean}) => void
    sx?: SxProps<Theme>
}

const ResourceAttributesFilter = (p: Props) => {
    const uiContext = useContext(UiContext)
    const t = uiContext.i18n.translator

    return <Stack sx={p.sx}>
        <Typography variant="h4" textAlign="center" color="primary">{uiContext.i18n.translator('filtersTitle')}</Typography>
        <OptionLine labels={{
            title: t('natureOptionsLabel'),
            isProduct: 'isProduct',
            isService: 'isService'
        }} values={{ 'isProduct': p.searchParameters.isProduct, isService: p.searchParameters.isService }} onChange={ p.onChange }/>
        <OptionLine labels={{ 
            title: t('exchangeTypeOptionsLabel'),
            canBeGifted: 'canBeGifted',
            canBeExchanged: 'canBeExchanged'
        }} values={{ 'canBeGifted': p.searchParameters.canBeGifted, 'canBeExchanged': p.searchParameters.canBeExchanged }} onChange={ p.onChange }/>
        <OptionLine labels={{ 
            title: t('deliveryOptionsLabel'),
            canBeTakenAway: 'canBeTakenAway',
            canBeDelivered: 'canBeDelivered'
        }} values={{ 'canBeTakenAway': p.searchParameters.canBeTakenAway, 'canBeDelivered': p.searchParameters.canBeDelivered }} onChange={ p.onChange }/>
    </Stack>
} 

export default ResourceAttributesFilter