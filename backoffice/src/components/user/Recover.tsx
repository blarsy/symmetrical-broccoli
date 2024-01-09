import { TextField, Box, Stack, Alert, Typography } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import { Formik } from "formik"
import * as yup from 'yup'
import RecoverIcon from '@mui/icons-material/LockReset'
import Feedback from "@/components/Feedback"
import { useState } from "react"
import axios from "axios"
import { isValidPassword } from "@/utils"
import Link from "next/link"
import { gql, useMutation } from "@apollo/client"

const RECOVER = gql`mutation RecoverAccount($newPassword: String, $recoveryCode: String) {
    recoverAccount(input: {newPassword: $newPassword, recoveryCode: $recoveryCode}) {
      integer
    }
  }
  `

interface Props {
    recoveryId: string
}

const Recover = ({ recoveryId }: Props) => {
    const [success, setSuccess] = useState(false)
    const [recover, { error, reset }] = useMutation(RECOVER)

    if(success) {
        return <Stack alignItems="center" gap="2rem">
            <Alert severity="success">Votre mot de passe a &#233;t&#233; chang&#233;</Alert>
            <Typography variant="overline">Ouvrez l&apos;app mobile pour vous reconnecter</Typography>
        </Stack>
    }

    return <Formik initialValues={{ password: '', repeatPassword: '' }}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                setSubmitting(true)
                await recover({ variables: { newPassword: values.password, recoveryCode: recoveryId }})
                setSuccess(true)
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            password: yup.string().test({ 
                name: 'passwordValid', 
                message: 'Mot de passe invalide. Au moins 8 caractères, dont une majuscule et un caractère spécial.', 
                test: val => !val || isValidPassword(val)
            }).required('Ce champ est requis'),
            repeatPassword: yup.string().test({ 
                name: 'repeatPasswordValid', 
                message: 'Ce mot de passe n\est pas identique à celui du dessus.', 
                test: (val, ctx) => ctx.parent.password && val && val === ctx.parent.password
            }).required('Ce champ est requis'),
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
                    <TextField size="small" id="password" type="password" {...getFieldProps('password')} variant="standard"
                        label="Mot de passe" error={!!errors.password} helperText={touched.password && errors.password}/>
                    <TextField size="small" id="repeatPassword" type="password" {...getFieldProps('repeatPassword')} variant="standard"
                        label="Répéter le mot de passe" error={!!errors.repeatPassword} helperText={touched.repeatPassword && errors.repeatPassword}/>
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<RecoverIcon />}
                        type="submit"
                        variant="contained">Récupération</LoadingButton>
                    {error && <Feedback severity="error" message={error.name} 
                        detail={error.message} 
                        onClose={() => reset()}/>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default Recover