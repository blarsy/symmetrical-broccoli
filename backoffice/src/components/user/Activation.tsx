import { Box, Stack, Alert, CircularProgress } from "@mui/material"
import Feedback from "@/components/scaffold/Feedback"
import { ReactNode, useContext, useEffect, useState } from "react"
import { gql, useMutation } from "@apollo/client"
import i18n from "@/i18n"
import { TFunction } from "i18next"
import { error } from "@/lib/logger"
import { AppContext } from "../scaffold/AppContextProvider"
import { UiContext } from "../scaffold/UiContextProvider"

const ACTIVATE = gql`mutation ActivateAccount($activationCode: String) {
    activateAccount(input: {activationCode: $activationCode}) {
        string
    }
}`

interface Props {
    activationId: string
}

const Activation = ({ activationId }: Props) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const [uiState, setUiState] = useState({ loading: true, error: undefined, t: undefined } as { loading: boolean, error?: { name: string, message: string}, t?:  TFunction<"translation", undefined> })
    const [activate] = useMutation(ACTIVATE)

    useEffect(() => {
        const load = async () => {
            const defaultTPromise = i18n()
            try {
                const res = await activate({ variables: { activationCode: activationId } })
                const t = await i18n(res.data.activateAccount.string)
                setUiState({ loading: false, error: undefined, t })
            } catch (e: any) {
                error({ message: (e as Error).toString(), accountId: appContext.account?.id }, uiContext.version, true)
                const t = await defaultTPromise
                setUiState({ loading: false, error: {name: t('activation_error'), message: (e as Error).message }})
            }
        }
        load()
    }, [])

    let content: ReactNode

    if(uiState.loading) {
        content = <CircularProgress color="primary"/>
    } else if(uiState.error) {
        content = <Feedback visible={!!uiState.error} severity="error" message={uiState.error.name} 
            detail={uiState.error.message} 
            onClose={() => {}}/>
    } else {
        content = (<Stack alignItems="center" gap="2rem">
            <Feedback severity="success" message={uiState.t && uiState.t('email_activated')} />
        </Stack>)
    }

    return <Box display="flex" justifyItems="center" paddingTop="2rem">
        {content}
    </Box>
}

export default Activation