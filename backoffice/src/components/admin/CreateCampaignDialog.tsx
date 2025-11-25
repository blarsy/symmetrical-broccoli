import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { LoadingButton } from "@mui/lab"
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers'
import Feedback from "../scaffold/Feedback"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { ErrorMessage, Formik } from "formik"
import * as yup from "yup"
import { gql, useMutation } from "@apollo/client"
import { ErrorText } from "../misc"
import dayjs from "dayjs"

export const CREATE_CAMPAIGN = gql`mutation CreateCampaign($name: String, $beginning: Datetime, $ending: Datetime, $description: String, $defaultResourceCategories: [Int], $airdrop: Datetime, $resourceRewardsMultiplier: Int, $airdropAmount: Int) {
  createCampaign(
    input: {airdrop: $airdrop, defaultResourceCategories: $defaultResourceCategories, description: $description, ending: $ending, beginning: $beginning, name: $name, resourceRewardsMultiplier: $resourceRewardsMultiplier, airdropAmount: $airdropAmount}
  ) {
    integer
  }
}`

interface DatetimeFieldProps {
    label: string
    value: Date
    onChange: (newDate: Date) => void
}

const DatetimeField = (p: DatetimeFieldProps) => <Stack direction="row" alignItems="flex-start" gap="1rem">
    <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{p.label}</Typography>
    <DateTimePicker closeOnSelect defaultValue={dayjs()} disablePast
        label={p.label} value={dayjs(p.value)} 
        onChange={(e: any) => {
            p.onChange(e?.toDate())
        }} />
</Stack>

interface Props {
    visible: boolean
    onClose: (sucess?: boolean) => void
}

const CreateCampaignDialog = (p: Props) => {
    const [campaignStatus, setCampaignStatus] = useState<DataLoadState<undefined>>(initial(false))
    const [createCampaign] = useMutation(CREATE_CAMPAIGN)

    return <Formik initialValues={{ name: '', description: '', beginning: dayjs().add(1, "day").toDate(), ending: dayjs().add(1, "month").toDate(), 
        airdrop: dayjs().add(2, "week").toDate(), airdropAmount: 3000, resourceRewardsMultiplier: 5 }}
        onSubmit={async values => {
            setCampaignStatus(initial(true))
            try {
                const res = await createCampaign({ variables: { 
                    name: values.name, beginning: values.beginning, ending: values.ending, description: values.description, 
                    defaultResourceCategories: [], airdrop: values.airdrop, airdropAmount: values.airdropAmount, resourceRewardsMultiplier: values.resourceRewardsMultiplier
                 } })
                if(res.data.createCampaign.integer && res.data.createCampaign.integer < 0) {
                    throw new Error('Unexpected return value on bid creation')
                } else {
                    setCampaignStatus(fromData(undefined))
                    p.onClose(true)
                }
            } catch(e) {
                setCampaignStatus(fromError(e, 'Request Error'))
            }
        }} validationSchema={yup.object().shape({
            name: yup.string().required('required').max(30, 'Name too long'),
            resourceRewardsMultiplier: yup.number().required('required').integer('Must be an integer')
                .min(1, 'Must be positive')
                .max(20, 'That does not look reasonable'),
            beginning: yup.date().required('required').test('beginningBeforeCampaignEndAndBeforeAirdrop', 'Campaign must start must before airdrop and campaign end', (val, ctx) => val < ctx.parent.ending && val < ctx.parent.airdrop),
            ending: yup.date().required('required').min(dayjs().add(2, 'day')),
            airdrop: yup.date().required('required').min(dayjs().add(1, 'day')).test('airdropBeforeCampaignEndAndAfterBegin', 'Airdrop must happen within campaign duration', (val, ctx) => val < ctx.parent.ending && val > ctx.parent.beginning),
            airdropAmount: yup.date().required('required')
    })}>
        { ({ handleSubmit, handleChange, handleBlur, values, setFieldValue }) =>
        <Dialog open={p.visible} onClose={() => p.onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create campaign</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextField label="Name"  sx={{ flex: 1 }} value={values.name} 
                    required onChange={handleChange('name')} 
                    onBlur={handleBlur('name')}/>
                <ErrorMessage component={ErrorText} name="name" />
                <TextField label="Description" multiline sx={{ flex: 1 }} value={values.description} 
                    onChange={handleChange('description')} 
                    onBlur={handleBlur('description')}/>
                <ErrorMessage component={ErrorText} name="description" />
                <TextField label="Resource rewards multiplier" sx={{ flex: 1 }} value={values.resourceRewardsMultiplier} 
                    type="number" required onChange={handleChange('resourceRewardsMultiplier')} onBlur={handleBlur('resourceRewardsMultiplier')}/>
                <ErrorMessage component={ErrorText} name="resourceRewardsMultiplier" />
                <DatetimeField label="Beginning" value={values.beginning} onChange={newDate => setFieldValue('beginning', newDate)} />
                <ErrorMessage component={ErrorText} name="beginning" />
                <DatetimeField label="End" value={values.ending} onChange={newDate => setFieldValue('ending', newDate)} />
                <ErrorMessage component={ErrorText} name="ending" />
                <DatetimeField label="Airdrop time" value={values.airdrop} onChange={newDate => setFieldValue('airdrop', newDate)} />
                <ErrorMessage component={ErrorText} name="airdrop" />
                <TextField label="Airdrop amount" sx={{ flex: 1 }} value={values.airdropAmount} 
                    type="number" required onChange={handleChange('airdropAmount')} onBlur={handleBlur('airdropAmount')}/>
                <ErrorMessage component={ErrorText} name="airdropAmount" />
                <Feedback severity="error" detail={campaignStatus.error?.detail} message={campaignStatus.error?.message}
                    onClose={() => setCampaignStatus(initial(false))} visible={!!campaignStatus.error}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => p.onClose() }>Cancel</Button>
                <LoadingButton data-testid="CreateBidButton" loading={campaignStatus.loading} disabled={campaignStatus.loading} onClick={() => {
                    handleSubmit()
                }}>Ok</LoadingButton>
            </DialogActions>
        </Dialog>}
    </Formik>
}

export default CreateCampaignDialog