import { gql, useMutation, useQuery } from "@apollo/client"
import { useContext, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { Backdrop, CircularProgress, FormControl, FormControlLabel, IconButton, Popover, Radio, RadioGroup, Stack, Typography } from "@mui/material"
import { FieldTitle } from "../misc"
import LoadedZone from "../scaffold/LoadedZone"
import SmartPhone from '@mui/icons-material/Vibration'
import Feedback from "../scaffold/Feedback"
import { UiContext } from "../scaffold/UiContextProvider"

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
    const uiContext = useContext(UiContext)
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
                        <Typography variant="body1" color="primary">{uiContext.i18n.translator('notificationOptionPushLabel')}</Typography>
                        <IconButton onMouseEnter={e => setAnchorEl(e.currentTarget)}>
                            <SmartPhone color="primary"/>
                        </IconButton>
                        <Popover open={!!anchorEl} anchorEl={anchorEl} anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }} onClose={() => setAnchorEl(null)}>
                            <Typography sx={{ padding: '0.5rem' }} color="primary" variant="body1">{uiContext.i18n.translator('requiresTheAppPopover')}</Typography>
                        </Popover>
                    </Stack>} />
                <FormControlLabel color="primary" value="emailSummary" control={<Radio />}
                    label={<Typography variant="body1" color="primary">{uiContext.i18n.translator('notificationOptionEmailSummaryLabel')}</Typography>} />
            </RadioGroup>
        </FormControl>
        <RadioGroup sx={{ paddingLeft: '3rem' }} name="emailSummaryInterval" value={currentValue.numberOfDaysBetweenSummaries} 
            onChange={e => {
                const newVal = Number(e.target.value)
                setCurrentValue({ numberOfDaysBetweenSummaries: Number(e.target.value) })
                if(newVal != currentValue.numberOfDaysBetweenSummaries){
                    p.onChange(newVal)
                }
            }}>
            {
                [1, 3, 7, 30].map(val => <FormControlLabel key={val} disabled={currentValue.numberOfDaysBetweenSummaries === null} 
                    color="primary" value={val} control={<Radio />}
                    label={<Typography variant="body1" color="primary">
                        {`${uiContext.i18n.translator('maximum')} ${val} ${uiContext.i18n.translator('days')}`}
                    </Typography>} />
                )
            }
       </RadioGroup>
    </Stack>
}

const Preferences = () => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const { data, loading, error } = useQuery(GET_PREFERENCES, { variables: { id: appContext.account?.id } })
    const [update, { loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_BROADCAST_PREFS)

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

    return <LoadedZone loading={loading} error={error} containerStyle={{ alignItems: 'center', overflow: 'auto' }}>
        <Stack sx={{ maxWidth: '40rem', paddingBottom: '1rem', gap: '2rem' }}>
            <Typography textAlign="center" color="primary" variant="h1">{uiContext.i18n.translator('prefPageTitle')}</Typography>
            <PrefSelector value={ prefs.pref1 } title={uiContext.i18n.translator('chatMessageNotificationsTitle')}
                onChange={numberOfDaysBetweenSummaries =>  update({ variables: { prefs: [
                    { eventType: 1, daysBetweenSummaries: numberOfDaysBetweenSummaries},
                    { eventType: 2, daysBetweenSummaries: prefs.pref2.numberOfDaysBetweenSummaries }
                ] } })} />
            <PrefSelector value={ prefs.pref2 }  title={uiContext.i18n.translator('newResourceNotificationsTitle')}
                onChange={numberOfDaysBetweenSummaries =>  update({ variables: { prefs: [
                    { eventType: 1, daysBetweenSummaries: prefs.pref1.numberOfDaysBetweenSummaries},
                    { eventType: 2, daysBetweenSummaries: numberOfDaysBetweenSummaries }
                ] } })} />
            <Backdrop
                open={updating}
                onClick={() => {}}>
                <CircularProgress color="primary" />
            </Backdrop>
            <Feedback severity="error" onClose={reset} visible={!!updateError}
                detail={updateError?.message} />
        </Stack>
    </LoadedZone>
}

export default Preferences