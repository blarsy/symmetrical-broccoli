import { Box, TextField } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import { DateTimePicker } from '@mui/x-date-pickers'
import axios from "axios"
import { Formik } from "formik"
import { useState } from "react"
import * as yup from 'yup'
import { LoadingButton } from "@mui/lab"
import Feedback from "../Feedback"
import dayjs, { Dayjs } from "dayjs"
import { Resource } from "@/apiutil"

interface Props {
    onSuccess: (itemSaved: any) => void,
    data: Resource
}

const EditResource = ({ data, onSuccess }: Props ) => {
    const [ errorInfo, setErrorInfo ] = useState({} as { message: string, detail: string })
    const minExpiration = new Date(Date.now() + 60 * 60 * 1000)
    return <Formik initialValues={{ title: data.title, description: data.description, 
        expiration: data.expiration}}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                const res = await axios.post('/api/resource', { 
                    title: values.title, description: values.description, expiration: values.expiration },
                    { headers: { Authorization: localStorage.getItem('token') }})
                onSuccess(res)
            } catch(e: any) {
                setErrorInfo({ message: 'Echec de l\'authentification.', detail: e.toString() })
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            title: yup.string().required('Ce champ est requis').max(30, 'Ce titre est trop long'),
            description: yup.string().required('Ce champ est requis'),
            expiration: yup.date().transform((value: Dayjs) => isNaN(value.valueOf()) ? undefined : value).typeError('Veuillez entrer une date valide')
                .test('expirationIsEnoughInTheFuture', 'Cette offre doit durer au moins une heure', val => {
                    return !!val && val > minExpiration
                })
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            isSubmitting,
            getFieldProps, 
            setFieldValue
        }) => (
        <form onSubmit={handleSubmit}>
            <Box display="flex" padding="1rem" justifyContent="center">
                <Box display="flex" flexDirection="column" maxWidth="25em" gap="0.5rem">
                    <TextField size="small" id="title" variant="standard" type="text" {...getFieldProps('title')} 
                        label="Titre" error={!!errors.title} helperText={touched.title && errors.title}/>
                    <TextField id="description" size="small" name="description" multiline
                        label="Description" type="text" variant="standard" value={values.description} 
                        onChange={handleChange} error={touched.description && !!errors.description} 
                        helperText={touched.description && errors.description as string}/>
                    <DateTimePicker
                        ampm={false}
                        label="Expiration"
                        onChange={(value: any) => {
                            setFieldValue('expiration', value, true)
                        }}
                        minDateTime={minExpiration}
                        value={values.expiration} 
                        slotProps={{ textField: { size: 'small', variant: 'standard', 
                            helperText: touched.expiration && errors.expiration as string,
                            error: touched.expiration && !!errors.expiration
                        }}}
                        />
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<AddIcon />}
                        type="submit"
                        variant="contained">Créer</LoadingButton>
                    {errorInfo.message && <Feedback severity="error" message={errorInfo.message} 
                        detail={errorInfo.detail} 
                        onClose={() => setErrorInfo({ message: '', detail: '' })}/>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default EditResource