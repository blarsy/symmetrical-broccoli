import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material"
import { AppContext } from "../scaffold/AppContextProvider"
import { useContext } from "react"

const OptionLine = (p: { label: string, values: {[name: string]: boolean}, onChange: (newValues: {[name: string]: boolean}) => void}) => {
    const appContext = useContext(AppContext)
    const t = appContext.i18n.translator
    
    return <Stack direction="row" alignItems="center" gap="1rem" margin="0 1rem">
        <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{p.label}</Typography>
        { Object.getOwnPropertyNames(p.values).map((val, idx) => <FormControlLabel key={idx} sx={{ 
            flex: 1,
            '& .MuiFormControlLabel-label': {
                color: 'primary.main'
            }
         }} 
            control={<Checkbox size="small" sx={{ padding: '0 0.25rem' }} checked={p.values[val]} onChange={e => {
                const newValues = {...p.values}
                newValues[val] = !newValues[val]
                p.onChange(newValues)
            }} />} label={t(val)} />) }
    </Stack>
}

export default OptionLine
