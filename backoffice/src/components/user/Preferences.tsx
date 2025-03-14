import { gql, useMutation, useQuery } from "@apollo/client"
import { useContext, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { FormControl, FormControlLabel, IconButton, Popover, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material"
import { FieldTitle } from "../misc"
import LoadedZone from "../scaffold/LoadedZone"
import SmartPhone from '@mui/icons-material/Vibration'

export const GET_PREFERENCES = gql`query Preferences($id: Int!) {
    accountById(id: $id) {
      id
      broadcastPrefsByAccountId {
        nodes {
          eventType
          id
          daysBetweenSummaries
        }
      }
    }
}`

const UPDATE_ACCOUNT_BROADCAST_PREFS = gql`mutation UpdateAccountBroadcastPrefs($prefs: [BroadcastPrefTypeInput]) {
    updateAccountBroadcastPrefs(input: {prefs: $prefs}) {
      integer
    }
}`

interface PrefSelectorProps {
    value: {
        numberOfDaysBetweenSummaries: number | null
    }
    onChange: (numberOfDaysBetweenSummaries: number | null) => void
    title: string
}

const PrefSelector = (p: PrefSelectorProps) => {
    const appContext = useContext(AppContext)
    const [currentValue, setCurrentValue] = useState<{ numberOfDaysBetweenSummaries: number | null | '' }>(p.value)
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

    return <Stack>
        <FieldTitle title={p.title} />
        <FormControl>
            <RadioGroup name="radio-buttons-group" value={currentValue.numberOfDaysBetweenSummaries === null ? 'push' : 'emailSummary'}
                onChange={e => {
                    const newVal = e.target.value === 'push' ? null : 1
                    setCurrentValue({ numberOfDaysBetweenSummaries: newVal })
                    if(newVal != currentValue.numberOfDaysBetweenSummaries){
                        p.onChange(newVal)
                    }
                }}>
                <FormControlLabel color="primary" value="push" control={<Radio />}
                    label={<Stack direction="row" gap="1rem" alignItems="center">
                        <Typography variant="body1" color="primary">{appContext.i18n.translator('notificationOptionPushLabel')}</Typography>
                        <IconButton onMouseEnter={e => setAnchorEl(e.currentTarget)}>
                            <SmartPhone color="primary"/>
                        </IconButton>
                        <Popover open={!!anchorEl} anchorEl={anchorEl} anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }} onClose={() => setAnchorEl(null)}>
                            <Typography sx={{ padding: '0.5rem' }} color="primary" variant="body1">{appContext.i18n.translator('requiresTheAppPopover')}</Typography>
                        </Popover>
                    </Stack>} />
                <FormControlLabel color="primary" value="emailSummary" control={<Radio />}
                    label={<Typography variant="body1" color="primary">{appContext.i18n.translator('notificationOptionEmailSummaryLabel')}</Typography>} />
            </RadioGroup>
        </FormControl>
        <TextField color="primary" sx={{ width: '10rem' }} label={appContext.i18n.translator('numberOfDaysBetweenSummariesLabel')}
            value={currentValue.numberOfDaysBetweenSummaries === "" ? '' : (currentValue.numberOfDaysBetweenSummaries || 1)} onChange={e => {
                let newVal: number | ''
                if(e.target.value === '0' || isNaN(Number(e.target.value))) {
                    newVal = 1
                } else if(e.target.value === '') {
                    newVal = ''
                } else {
                    newVal = Math.abs(Number(e.target.value))
                }
                setCurrentValue({ numberOfDaysBetweenSummaries: newVal })
                if(newVal != '' && newVal != currentValue.numberOfDaysBetweenSummaries){
                    p.onChange(newVal)
                }
            }} 
            disabled={currentValue.numberOfDaysBetweenSummaries === null} />
    </Stack>
} 

interface Props {
    
}

const Preferences = (p: Props) => {
    const appContext = useContext(AppContext)
    const { data, loading, error } = useQuery(GET_PREFERENCES, { variables: { id: appContext.account?.id } })
    const [update, { data: updateData, loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_BROADCAST_PREFS)

    const prefsFromData = (data: any): { pref1: {
        numberOfDaysBetweenSummaries: number | null
    }, pref2: {
        numberOfDaysBetweenSummaries: number | null
    } } => {
        const 
            rawPref1 = data?.accountById?.broadcastPrefsByAccountId?.nodes?.find((pref: any) => pref.eventType === 1),
            rawPref2 = data?.accountById?.broadcastPrefsByAccountId?.nodes?.find((pref: any) => pref.eventType === 2)
        return {
            pref1: { numberOfDaysBetweenSummaries : rawPref1 && rawPref1.daysBetweenSummaries != -1 ? rawPref1.daysBetweenSummaries : 1 },
            pref2: { numberOfDaysBetweenSummaries : rawPref2 && rawPref2.daysBetweenSummaries != -1 ? rawPref2.daysBetweenSummaries : 1 }
        }
    }

    const prefs = prefsFromData(data)

    return <LoadedZone loading={loading} error={error} containerStyle={{ alignItems: 'center' }}>
        <Stack sx={{ maxWidth: '40rem', paddingBottom: '1rem', gap: '1rem' }}>
            <Typography textAlign="center" color="primary" variant="h1">{appContext.i18n.translator('prefPageTitle')}</Typography>
            <PrefSelector value={ prefs.pref1 } title={appContext.i18n.translator('chatMessageNotificationsTitle')}
                onChange={numberOfDaysBetweenSummaries =>  update({ variables: { prefs: [
                    { eventType: 1, daysBetweenSummaries: numberOfDaysBetweenSummaries},
                    { eventType: 2, daysBetweenSummaries: prefs.pref2.numberOfDaysBetweenSummaries }
                ] } })} />
            <PrefSelector value={ prefs.pref2 }  title={appContext.i18n.translator('newResourceNotificationsTitle')}
                onChange={numberOfDaysBetweenSummaries =>  update({ variables: { prefs: [
                    { eventType: 1, daysBetweenSummaries: prefs.pref1.numberOfDaysBetweenSummaries},
                    { eventType: 2, daysBetweenSummaries: numberOfDaysBetweenSummaries }
                ] } })} />
        </Stack>
    </LoadedZone>
}

export default Preferences