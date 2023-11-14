import { TextField, Box } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import { Formik } from "formik"
import * as yup from 'yup'
import RegisterIcon from '@mui/icons-material/HowToReg'
import Feedback from "@/components/Feedback"
import { useState } from "react"
import axios, { AxiosError } from "axios"
import { DUPLICATE_EMAIL } from "@/utils"

interface Props {
    onSuccess: () => void
}

const Register = ({ onSuccess }: Props) => {
    const [errorInfo, setErrorInfo] = useState({ message: '', detail: '' })

    return <Formik initialValues={{ email: '', password: '', name: '' }}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                setSubmitting(true)
                await axios.post('/api/user', { email: values.email, name: values.name, password: values.password})
                onSuccess()
            } catch(e: any) {
                const err = (e as AxiosError)
                if(!err) {
                    setErrorInfo({ message: (e as string), detail: '' })
                } else {
                    console.log(err.response?.data)
                    if(err.response?.data === DUPLICATE_EMAIL) {
                        setErrorInfo({ message: 'Cette adresse email est déjà utilisée. Vous pouvez restaurer l\'accès à ce compte.', detail: '' })
                    } else {
                        setErrorInfo({ message: 'Ce nom d\'association est déjà utilisé.', detail: '' })
                    }
                }
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            email: yup.string().email('Veuillez entrer une adresse email valide').required('Ce champ est requis'),
            password: yup.string().required('Ce champ est requis'),
            name: yup.string().required('Ce champ est requis')
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            isSubmitting,
            getFieldProps
        }) => (
        <form onSubmit={handleSubmit}>
            <Box display="flex" padding="1rem" justifyContent="center">
                <Box display="flex" flexDirection="column" maxWidth="25em" gap="0.5rem">
                    <TextField size="small" id="name" type="text" {...getFieldProps('name')} variant="standard"
                        error={!!errors.name} label="Nom de l'association" helperText={touched.name && errors.name}/>
                    <TextField size="small" id="email" type="text" {...getFieldProps('email')} variant="standard"
                        label="Email" error={!!errors.email} helperText={touched.email && errors.email}/>
                    <TextField id="password" name="password" autoComplete="current-password" 
                        label="Mot de passe" type="password" variant="standard" value={values.password} 
                        onChange={handleChange} error={touched.password && !!errors.password} 
                        helperText={touched.password && errors.password as string}/>
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<RegisterIcon />}
                        type="submit"
                        variant="contained">Inscription</LoadingButton>
                    {errorInfo.message && <Feedback severity="error" message={errorInfo.message} 
                        detail={errorInfo.detail} 
                        onClose={() => setErrorInfo({ message: '', detail: '' })}/>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default Register