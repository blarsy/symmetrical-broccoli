import { Checkbox, FormControlLabel, Typography, Stack, SxProps, Theme } from "@mui/material"
import { t } from "i18next"
import { useContext } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { SearchParameters } from "./SearchFilter"

const FilterLine = (p: { label: string, values: {[name: string]: boolean}, onChange: (newValues: {[name: string]: boolean}) => void}) => {
    return <Stack direction="row" alignItems="center" gap="1rem" margin="0 1rem">
        <Typography variant="body1" sx={{ flex: '0 0 7rem' }}>{p.label}</Typography>
        { Object.getOwnPropertyNames(p.values).map((val, idx) => <FormControlLabel key={idx} sx={{ flex: 1 }} control={<Checkbox size="small" sx={{ padding: '0 0.25rem' }} checked={p.values[val]} onChange={e => {
            const newValues = {...p.values}
            newValues[val] = !newValues[val]
            p.onChange(newValues)
        }} />} label={t(val)} />) }
    </Stack>
}

interface Props {
    searchParameters: SearchParameters
    onChange: (newValue:  {[name: string]: boolean}) => void
    sx?: SxProps<Theme>
}

const ResourceAttributesFilter = (p: Props) => {
    const appContext = useContext(AppContext)

    return <Stack sx={p.sx}>
        <Typography variant="h4" textAlign="center">{appContext.i18n.translator('filtersTitle')}</Typography>
        <FilterLine label={t('natureOptionsLabel')} values={{ 'isProduct': p.searchParameters.isProduct, isService: p.searchParameters.isService }} onChange={ p.onChange }/>
        <FilterLine label={t('exchangeTypeOptionsLabel')} values={{ 'canBeGifted': p.searchParameters.canBeGifted, 'canBeExchanged': p.searchParameters.canBeExchanged }} onChange={ p.onChange }/>
        <FilterLine label={t('deliveryOptionsLabel')} values={{ 'canBeTakenAway': p.searchParameters.canBeTakenAway, 'canBeDelivered': p.searchParameters.canBeDelivered }} onChange={ p.onChange }/>
    </Stack>
} 

export default ResourceAttributesFilter