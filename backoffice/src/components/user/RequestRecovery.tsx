import { TextField, Box, Alert } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import { Formik } from "formik"
import * as yup from 'yup'
import RecoverIcon from '@mui/icons-material/LockReset'
import Feedback from "@/components/Feedback"
import { useState } from "react"
import axios from "axios"

const RequestRecovery = () => {
    const [errorInfo, setErrorInfo] = useState({ message: '', detail: '' })
    const [success, setSuccess] = useState(false)

    return <Formik initialValues={{ email: '' }}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                setSubmitting(true)
                await axios.put('/api/user/recovery', { email: values.email })
                setSuccess(true)
            } catch(e: any) {
                setErrorInfo({ message: e.toString(), detail: '' })
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            email: yup.string().email('Veuillez entrer une adresse email valide').required('Ce champ est requis')
        })} >
        {({
            errors,
            touched,
            handleSubmit,
            isSubmitting,
            getFieldProps
        }) => (
        <form onSubmit={handleSubmit}>
            <Box display="flex" padding="1rem" justifyContent="center">
                <Box display="flex" flexDirection="column" maxWidth="25em" gap="0.5rem">
                    <TextField size="small" id="email" type="text" {...getFieldProps('email')} variant="standard"
                        label="Email" error={!!errors.email} helperText={touched.email && errors.email}/>
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<RecoverIcon />}
                        type="submit"
                        variant="contained">Récupération</LoadingButton>
                    {errorInfo.message && <Feedback severity="error" message={errorInfo.message} 
                        detail={errorInfo.detail} 
                        onClose={() => setErrorInfo({ message: '', detail: '' })}/>}
                    {success && <Alert severity="success">Un email de récupération vous a été envoyé.</Alert>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default RequestRecovery