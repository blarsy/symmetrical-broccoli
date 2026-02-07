import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { ErrorMessage, FieldArray, Formik } from "formik"
import * as yup from "yup"
import { gql, useMutation, useQuery } from "@apollo/client"
import { ErrorText } from "../misc"
import dayjs from "dayjs"
import DatetimeField from "./lib/DatetimeField"
import RemoveIcon from "@mui/icons-material/Delete"
import LoadedZone from "../scaffold/LoadedZone"

export const CREATE_GRANT = gql`mutation CreateGrant($amount: Int, $data: JSON, $description: String, $expiration: Datetime, $title: String) {
  createGrant(
    input: {amount: $amount, data: $data, description: $description, expiration: $expiration, title: $title}
  ) {
    integer
  }
}`

const GET_CAMPAIGNS = gql`query GetCampaigns {
  getCampaigns {
    nodes {
      created
      beginning
      ending
      id
      name
    }
  }
}`

const CampaignSelector = (p: { value: string | null, onSelected: (val?: string) => void }) => {
    const { data, loading, error } = useQuery(GET_CAMPAIGNS)
    return <LoadedZone loading={loading} error={error}>
        <InputLabel id="campaign-label">Campaign participation</InputLabel>
        <Select labelId="campaign-label" value={p.value || ''} onChange={val => p.onSelected(val.target.value as string|undefined)}>
            { data && data.getCampaigns && data.getCampaigns.nodes.map((campaign: any) => (<MenuItem value={campaign.id}>{`${campaign.name} ${dayjs(campaign.beginning).format('DD/MM/YYYY')} - ${dayjs(campaign.ending).format('DD/MM/YYYY')}, created ${dayjs(campaign.created).format('DD/MM/YYYY')}`}</MenuItem>))}
        </Select>
    </LoadedZone>
}

interface GrantConditions {
    emails?: string[],
    maxNumberOfGrants?: number,
    activeInCampaign?: string,
}

interface Props {
    visible: boolean
    onClose: (sucess?: boolean) => void
}

const emptyGrantConditions : GrantConditions = {
    emails: undefined, maxNumberOfGrants: undefined, activeInCampaign: undefined
}

const GrantConditionsEditor = (p : { value: GrantConditions, onChange: (newValue: GrantConditions) => void }) => {
    return <Formik initialValues={emptyGrantConditions} validationSchema={yup.object().shape({
        emails: yup.array().of(yup.string().email()),
        maxNumberOfGrants: yup.number().min(1),
        activeInCampaign: yup.number()
    })} onSubmit={val => {
        p.onChange(val)
    }}>
        { ({ handleSubmit, handleChange, handleBlur, values, setFieldValue, dirty }) =>
            <Stack gap="1rem" padding="0.25rem" border="1px solid #ccc">
                <FieldArray name="emails" render={arrayHelpers => <Stack>
                    {values.emails && values.emails.map((email, idx) => <Stack key={idx} direction="row" padding="0.25rem">
                        <IconButton onClick={() => arrayHelpers.remove(idx)}><RemoveIcon /></IconButton>
                        <TextField label="Email"  sx={{ flex: 1 }} value={email} 
                            required onChange={handleChange(`emails.${idx}`)} 
                            onBlur={handleBlur(`emails.${idx}`)}/>
                        <ErrorMessage component={ErrorText} name={`emails.${idx}`} />
                    </Stack>)}
                    <Button variant="outlined" sx={{ alignSelf: 'center' }} onClick={() => arrayHelpers.push('')}>Add email</Button>
                </Stack>}/>
                <TextField label="Max number of grants" sx={{ flex: 1 }} value={values.maxNumberOfGrants || ''} 
                    type="number" onChange={handleChange('maxNumberOfGrants')} onBlur={handleBlur('maxNumberOfGrants')}/>
                <ErrorMessage component={ErrorText} name="maxNumberOfGrants" />
                <CampaignSelector onSelected={campaignId => setFieldValue('activeInCampaign', campaignId)} value={values.activeInCampaign || null}/>
                <Button type="submit" disabled={!dirty} onClick={() => handleSubmit()}>{ dirty ? 'Save' : 'All changes saved'}</Button>
            </Stack>
        }
    </Formik>
}

const CreateGrantDialog = (p: Props) => {
    const [grantStatus, setGrantStatus] = useState<DataLoadState<undefined>>(initial(false))
    const [createGrant] = useMutation(CREATE_GRANT)

    return <Formik initialValues={{ title: '', description: '', expiration: dayjs().add(10, "day").toDate(), 
        amount: 3000, data: {} }}
        onSubmit={async values => {
            setGrantStatus(initial(true))
            try {
                const res = await createGrant({ variables: { 
                    title: values.title, description: values.description, expiration: values.expiration,
                    amount: values.amount, data: values.data
                 } })
                if(res.data.createGrant.integer && res.data.createGrant.integer < 0) {
                    throw new Error('Unexpected return value on grant creation')
                } else {
                    setGrantStatus(fromData(undefined))
                    p.onClose(true)
                }
            } catch(e) {
                setGrantStatus(fromError(e, 'Request Error'))
            }
        }} validationSchema={yup.object().shape({
            title: yup.string().required('required').max(30, 'Title too long'),
            expiration: yup.date().required('required').min(dayjs().add(2, 'day')),
            amount: yup.number().required('required')
    })}>
        { ({ handleSubmit, handleChange, handleBlur, values, setFieldValue }) =>
        <Dialog open={p.visible} onClose={() => p.onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create grant</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextField label="Title" sx={{ flex: 1 }} value={values.title} 
                    required onChange={handleChange('title')} 
                    onBlur={handleBlur('title')}/>
                <ErrorMessage component={ErrorText} name="title" />
                <TextField label="Description" multiline sx={{ flex: 1 }} value={values.description} 
                    onChange={handleChange('description')} 
                    onBlur={handleBlur('description')}/>
                <ErrorMessage component={ErrorText} name="description" />
                <DatetimeField label="Expiration" value={values.expiration} onChange={newDate => setFieldValue('expiration', newDate)} />
                <ErrorMessage component={ErrorText} name="expiration" />
                <TextField label="Amount" sx={{ flex: 1 }} value={values.amount} 
                    type="number" required onChange={handleChange('amount')} onBlur={handleBlur('amount')}/>
                <ErrorMessage component={ErrorText} name="amount" />
                <Typography variant="body1" color="primary">Conditions</Typography>
                <GrantConditionsEditor value={values.data} onChange={(newValue: any) => setFieldValue('data', newValue)}/>
                <Feedback severity="error" detail={grantStatus.error?.detail} message={grantStatus.error?.message}
                    onClose={() => setGrantStatus(initial(false))} visible={!!grantStatus.error}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => p.onClose() }>Cancel</Button>
                <LoadingButton data-testid="CreateBidButton" loading={grantStatus.loading} disabled={grantStatus.loading} onClick={() => {
                    handleSubmit()
                }}>Ok</LoadingButton>
            </DialogActions>
        </Dialog>}
    </Formik>
}

export default CreateGrantDialog