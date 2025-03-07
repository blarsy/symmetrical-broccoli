import { Stack } from "@mui/system"
import { ErrorMessage, Formik } from "formik"
import { useContext, useRef, useState } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../scaffold/AppContextProvider"
import useProfile from "@/lib/useProfile"
import * as yup from "yup"
import { Alert, Backdrop, CircularProgress, IconButton, TextField, Typography } from "@mui/material"
import { ErrorText } from "../misc"
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import Check from '@mui/icons-material/Check'
import Close from '@mui/icons-material/Close'
import LoadedZone from "../scaffold/LoadedZone"
import AvatarEdit from "./AvatarEdit"
import { gql, useMutation } from "@apollo/client"

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

interface RightAlignedModifyButtonsProps {
    editing: boolean
    onEditRequested: () => void
    saveButtonDisabled: boolean
    onSave: () => void
    onDelete?: () => void
    onCancelEdit?: () => void
}

export const RightAlignedModifyButtons = (p: RightAlignedModifyButtonsProps) => <Stack sx={{ position: 'absolute', flexDirection: 'row', right: '14px', bottom: p.editing ? '13px' : '14px', gap: '3px' }}>
    { !p.editing && <IconButton onClick={p.onEditRequested}><Edit/></IconButton> }
    { p.editing && [
        <IconButton key="save" color="secondary" disabled={p.saveButtonDisabled} onClick={p.onSave}><Check/></IconButton>,
        <IconButton key="cancel" color="secondary" onClick={p.onCancelEdit}><Close/></IconButton>
    ] }
    { p.onDelete && <IconButton color="secondary" onClick={p.onDelete}><Delete/></IconButton>}
</Stack>

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
                <TextField color="secondary" label={p.label} type={p.textContentType} value={values.value} onChange={handleChange('value')} 
                    onBlur={handleBlur('value')} inputRef={textInputRef}/>
                :[
                    <Typography key="lbl" color="secondary" sx={{ position: 'relative', left: '14px', fontSize: '0.75rem', top: '-10px' }} variant="body1">{p.label}</Typography>,
                    <Typography key="val" color="secondary" sx={{ position: 'relative', left: '14px', top: '-2px', paddingBottom: '14px' }}>{values.value}</Typography>
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
        { publicInfo.profileData.data && <Stack sx={{ width: '20rem' }}>
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
        </Stack> }
        <Backdrop
            open={updatingAccount || updatingEmail}
            onClick={() => {}}>
            <CircularProgress color="inherit" />
        </Backdrop>
        { updateError && <Alert severity="error" onClose={reset}>{updateError.message}</Alert> }
        { updateEmailError && <Alert severity="error" onClose={resetEmail}>{ updateEmailError.message }</Alert> }
    </LoadedZone>
}

export default Profile