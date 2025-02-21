import { TextField, Box, Stack, Alert, Typography, CircularProgress } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import { Formik } from "formik"
import * as yup from 'yup'
import RecoverIcon from '@mui/icons-material/LockReset'
import Feedback from "@/components/scaffold/Feedback"
import { useEffect, useState } from "react"
import { isValidPassword } from "@/utils"
import { gql, useMutation } from "@apollo/client"
import i18n from '@/i18n'
import { TFunction } from "i18next"

const RECOVER = gql`mutation RecoverAccount($newPassword: String, $recoveryCode: String) {
    recoverAccount(input: {newPassword: $newPassword, recoveryCode: $recoveryCode}) {
      integer
    }
  }`

interface Props {
    recoveryId: string
}

const Recover = ({ recoveryId }: Props) => {
    const [uiState, setUiState] = useState({ loading: true, t: undefined } as { loading: boolean, success?: boolean, error?: { message: string, name: string }, t?: TFunction<"translation", undefined>})
    const [recover, { error, reset }] = useMutation(RECOVER)

    useEffect(() => {
        const load = async () => {
            const t = await i18n()
            setUiState({ loading: false, t })
        }
        load()
    }, [])

    if(uiState.loading) {
        return <CircularProgress color="primary"/>
    } else if(uiState.success) {
        return <Stack alignItems="center" gap="2rem">
            <Alert severity="success">{uiState.t!('password_changed')}</Alert>
            <Typography variant="overline">{uiState.t!('open_on_mobile')}</Typography>
        </Stack>
    } else {
        return <Formik initialValues={{ password: '', repeatPassword: '' }}
            onSubmit={async (values, { setSubmitting }) => {
                try {
                    setSubmitting(true)
                    await recover({ variables: { newPassword: values.password, recoveryCode: recoveryId }})
                    setUiState({ loading: false, success: true, t: uiState.t})
                } catch(e) {
                    setUiState({ loading: false, error: { name: uiState.t!('recovery_error'), message: (e as Error).message }, t: uiState.t })
                } finally {
                    setSubmitting(false)
                }
            }} validationSchema={yup.object().shape({
                password: yup.string().test({ 
                    name: 'passwordValid', 
                    message: uiState.t!('invalid_password_format'), 
                    test: val => !val || isValidPassword(val)
                }).required(uiState.t!('required_field')),
                repeatPassword: yup.string().test({ 
                    name: 'repeatPasswordValid', 
                    message: uiState.t!('passwords_not_identical'), 
                    test: (val, ctx) => ctx.parent.password && val && val === ctx.parent.password
                }).required(uiState.t!('required_field')),
            })} >
            {({
                errors,
                touched,
                handleSubmit,
                isSubmitting,
                getFieldProps
            }) => <form onSubmit={handleSubmit}>
                <Box display="flex" padding="1rem" justifyContent="center">
                    <Box display="flex" flexDirection="column" maxWidth="25em" gap="0.5rem">
                        <TextField size="small" id="password" type="password" {...getFieldProps('password')} variant="standard"
                            label="Mot de passe" error={!!errors.password} helperText={touched.password && errors.password}/>
                        <TextField size="small" id="repeatPassword" type="password" {...getFieldProps('repeatPassword')} variant="standard"
                            label="Répéter le mot de passe" error={!!errors.repeatPassword} helperText={touched.repeatPassword && errors.repeatPassword}/>
                        <LoadingButton loading={isSubmitting}
                            loadingPosition="start"
                            startIcon={<RecoverIcon />}
                            type="submit"
                            variant="contained">{uiState.t!('recovery_title')}</LoadingButton>
                        {error && <Feedback severity="error" message={error.name} 
                            detail={error.message} 
                            onClose={() => reset()}/>}
                    </Box>
                </Box>
            </form>
            }
        </Formik>
    }
}

export default Recover