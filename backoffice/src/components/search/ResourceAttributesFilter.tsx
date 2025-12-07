import { Typography, Stack, SxProps, Theme } from "@mui/material"
import { useContext } from "react"
import { SearchParameters } from "./SearchFilter"
import { UiContext } from "../scaffold/UiContextProvider"
import { ToggledChipList } from "./ChipList"

interface Props {
    searchParameters: SearchParameters
    onChange: (newValue:  {[name: string]: boolean}) => void
    sx?: SxProps<Theme>
}

const ResourceAttributesFilter = (p: Props) => {
    const uiContext = useContext(UiContext)
    const t = uiContext.i18n.translator

    return <Stack sx={p.sx} flexWrap="wrap" direction="row" gap="0.5rem">
        <Stack alignItems="center">
            <Typography variant="body1" color="primary">{t('natureOptionsLabel')}</Typography>
            <Stack direction="row" gap="0.25rem">
                <ToggledChipList options={{ isProduct: p.searchParameters.isProduct, isService: p.searchParameters.isService }}
                    onChange={newVal => p.onChange({ ...p.searchParameters, ...(newVal as any) })} />
            </Stack>
        </Stack>
        <Stack alignItems="center">
            <Typography variant="body1" color="primary">{t('exchangeTypeOptionsLabel')}</Typography>
            <Stack direction="row" gap="0.25rem">
                <ToggledChipList options={{ canBeGifted: p.searchParameters.canBeGifted, canBeExchanged: p.searchParameters.canBeExchanged }}
                    onChange={newVal => p.onChange({ ...p.searchParameters, ...(newVal as any) })} />
            </Stack>
        </Stack>
        <Stack alignItems="center">
            <Typography variant="body1" color="primary">{t('deliveryOptionsLabel')}</Typography>
            <Stack direction="row" gap="0.25rem">
                <ToggledChipList options={{ canBeTakenAway: p.searchParameters.canBeTakenAway, canBeDelivered: p.searchParameters.canBeDelivered }}
                    onChange={newVal => p.onChange({ ...p.searchParameters, ...(newVal as any) })} />
            </Stack>
        </Stack>
    </Stack>
} 

export default ResourceAttributesFilter