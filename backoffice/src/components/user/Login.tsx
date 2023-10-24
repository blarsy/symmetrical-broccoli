import { TextField, Box, Link } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import { Formik } from "formik"
import * as yup from 'yup'
import LoginIcon from '@mui/icons-material/LoginTwoTone'
import Feedback from "@/components/Feedback"
import { useContext, useState } from "react"
import axios from "axios"
import { AppContext } from "../AppContextProvider"

interface Props {
    onSuccess: () => void
}
const Login = ({ onSuccess }: Props) => {
    const appContext = useContext(AppContext)
    const [errorInfo, setErrorInfo] = useState({ message: '', detail: '' })

    return <Formik initialValues={{ email: '', password: '' }}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                const res = await axios.post('/api/auth', { email: values.email, password: values.password})
                localStorage.setItem('token', res.data.token)
                appContext.loggedIn(res.data.account)
                onSuccess()
            } catch(e: any) {
                setErrorInfo({ message: 'Echec de l\'authentification.', detail: e.toString() })
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            email: yup.string().email('Veuillez entrer une adresse email valide').required('Ce champ est requis'),
            password: yup.string().required('Ce champ est requis')
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            isSubmitting,
            getFieldProps
        }) =>
        <form onSubmit={handleSubmit}>
            <Box display="flex" padding="1rem" justifyContent="center">
                <Box display="flex" flexDirection="column" maxWidth="25em" gap="0.5rem">
                    <TextField autoComplete="username" size="small" id="email" variant="standard" type="text" {...getFieldProps('email')} 
                        label="Email" error={!!errors.email} helperText={touched.email && errors.email}/>
                    <TextField id="password" size="small" name="password" autoComplete="current-password" 
                        label="Mot de passe" type="password" variant="standard" value={values.password} 
                        onChange={handleChange} error={touched.password && !!errors.password} 
                        helperText={touched.password && errors.password as string}/>
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<LoginIcon />}
                        type="submit"
                        variant="contained">Se connecter</LoadingButton>
                    <Link style={{ textAlign: 'center' }} href="/webapp/recover">Mot de passe oublié ?</Link>
                    {errorInfo.message && <Feedback severity="error" message={errorInfo.message} 
                        detail={errorInfo.detail} 
                        onClose={() => setErrorInfo({ message: '', detail: '' })}/>}
                </Box>
            </Box>
        </form>
        }
    </Formik>
}

export default Login