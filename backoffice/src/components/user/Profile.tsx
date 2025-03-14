import { Stack } from "@mui/system"
import { ErrorMessage, Formik } from "formik"
import { useContext, useRef, useState } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../scaffold/AppContextProvider"
import useProfile from "@/lib/useProfile"
import * as yup from "yup"
import { Alert, Backdrop, CircularProgress, TextField, Typography } from "@mui/material"
import { ErrorText, RightAlignedModifyButtons } from "../misc"
import LoadedZone from "../scaffold/LoadedZone"
import AvatarEdit from "./AvatarEdit"
import { gql, useMutation } from "@apollo/client"
import EditLinks from "./EditLinks"
import EditAddress from "./EditAddress"

const UPDATE_ACCOUNT = gql`mutation UpdateAccount($name: String, $avatarPublicId: String) {
    updateAccount(
      input: {name: $name, avatarPublicId: $avatarPublicId}
    ) {
      integer
    }
}`

const UPDATE_ACCOUNT_EMAIL = gql`mutation UpdateAccountEmail($newEmail: String) {
    updateAccountEmail(input: {newEmail: $newEmail}) {
      integer
    }
}`

interface Props {
    label: string
    textContentType: React.InputHTMLAttributes<unknown>['type']
    initialValue: string
    testID?: string
    validationSchema: yup.Schema
    onSave: (value: string) => Promise<void>
    onDelete?: () => Promise<void>
}

const InlineFormTextInput = (p: Props) => {
    const appContext = useContext(AppContext)
    const [editing, setEditing] = useState(false)
    const textInputRef = useRef<HTMLInputElement>()

    return <Formik initialValues={{ value: p.initialValue }} 
        validationSchema={yup.object().shape({
            value: p.validationSchema
        })} onSubmit={async values => {
            await p.onSave(values.value)
            setEditing(false)
        }}>
    {({ handleChange, handleBlur, handleSubmit, values, submitCount, isValid, initialValues, setFieldValue }) => {
        const touched = initialValues.value != values.value
        
        return <Stack style={{ position: 'relative', padding: 5 }}>
            { editing ?
                <TextField color="primary" label={p.label} type={p.textContentType} value={values.value} onChange={handleChange('value')} 
                    onBlur={handleBlur('value')} inputRef={textInputRef}/>
                :[
                    <Typography key="lbl" color="primary" sx={{ position: 'relative', left: '14px', fontSize: '0.75rem', top: '-10px' }} variant="body1">{p.label}</Typography>,
                    <Typography key="val" color="primary" sx={{ position: 'relative', left: '14px', top: '-2px', paddingBottom: '14px' }}>{values.value}</Typography>
                ]
            }
            <RightAlignedModifyButtons editing={editing} saveButtonDisabled={!touched}
                onEditRequested={() => {
                    setEditing(true)
                    setTimeout(() => textInputRef.current?.focus(), 0)
                }} onSave={() => handleSubmit()} onCancelEdit={() => {
                    setEditing(false)                                                 
                    setFieldValue('value', initialValues.value)
                }} onDelete={p.onDelete} />
            <ErrorMessage component={ErrorText} name="value" />
            { submitCount > 0 && !isValid && <Stack style={{ marginTop: 20, alignSelf: 'center' }}>
                <ErrorText>{appContext.i18n.translator('someDataInvalid')}</ErrorText>
            </Stack>}
        </Stack>
    }}
    </Formik>
}

const Profile = () => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const publicInfo = useProfile()
    const [newEmailMustBeActivated, setNewEmailMustBeActivated] = useState(false)
    const [updateAccount, { error: updateError, reset, loading: updatingAccount }] = useMutation(UPDATE_ACCOUNT)
    const [updateAccountEmail, { error: updateEmailError, reset: resetEmail, loading: updatingEmail}] = useMutation(UPDATE_ACCOUNT_EMAIL)
    const t = appContext.i18n.translator

    return <LoadedZone loading={publicInfo.profileData.loading} containerStyle={{ alignItems: 'center' }}>
        { publicInfo.profileData.data && <Stack sx={{ maxWidth: '40rem', gap: '1rem', paddingBottom: '1rem' }}>
            <Typography textAlign="center" color="primary" variant="h1">{appContext.i18n.translator('profilePageTitle')}</Typography>
            <AvatarEdit initialValue={ appContext.account!.avatarPublicId } onChange={async newPublicId => {
                const updatedAccount = { ...appContext.account }
                updatedAccount.avatarPublicId = newPublicId
                appDispatch({ type: AppReducerActionType.UpdateAccount, payload: updatedAccount })
                await updateAccount({ variables: { name: appContext.account?.name, avatarPublicId: newPublicId } })
            }}/>
            <InlineFormTextInput initialValue={ appContext.account!.name } 
                label={t('nameFieldLabel')} textContentType="text"
                validationSchema={yup.string().required(t('requiredField')).max(30, t('nameTooLong'))}
                onSave={async (newVal) => {
                    const updatedAccount = { ...appContext.account }
                    updatedAccount.name = newVal
                    appDispatch({ type: AppReducerActionType.UpdateAccount, payload: updatedAccount })
                    updateAccount({ variables: { name: newVal, avatarPublicId: appContext.account?.avatarPublicId } })
                }} />
            <InlineFormTextInput initialValue={ appContext.account!.email } 
                label={t('emailFieldLabel')} textContentType="text"
                validationSchema={yup.string().email(t('invalidEmail'))}
                onSave={async (newEmail) => {
                    updateAccountEmail({ variables: { newEmail } })
                    setNewEmailMustBeActivated(true)
                }} />
            { newEmailMustBeActivated && <Alert severity="success">{t('newEmailMustBeActivated')}</Alert> }
            <EditLinks onDone={newLinks => publicInfo.updatePublicInfo(newLinks, publicInfo.profileData.data!.location)} 
                links={publicInfo.profileData.data.links}/>
            <EditAddress value={publicInfo.profileData.data.location} onChange={newLocation => {
                publicInfo.updatePublicInfo(publicInfo.profileData.data!.links, newLocation)
            }} />
        </Stack> }
        <Backdrop
            open={updatingAccount || updatingEmail}
            onClick={() => {}}>
            <CircularProgress color="primary" />
        </Backdrop>
        { updateError && <Alert severity="error" onClose={reset}>{updateError.message}</Alert> }
        { updateEmailError && <Alert severity="error" onClose={resetEmail}>{ updateEmailError.message }</Alert> }
    </LoadedZone>
}

export default Profile