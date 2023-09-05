import { useContext, useEffect } from "react"
import { fromData, fromError } from "../lib/DataLoadState"
import Login from "./Login"
import Main from "./Main"
import { AppContext } from "./AppContextProvider"
import { registerLoggedOutHandler } from "../lib/api"
import React from "react"
import i18n from '../i18n'
import Splash from "./Splash"

interface Props {
    loading: boolean
}

export const Start = ({ loading }: Props) => {
    const { t } = i18n
    const appContext = useContext(AppContext)
    useEffect(() => {
        const load = async () => {
            try {
                registerLoggedOutHandler(() => {
                    appContext.actions.setTokenState(fromData(''))
                })
                await appContext.actions.tryRestoreToken()
            } catch(e: any) {
                appContext.actions.setTokenState(fromError(e, t('save_error')))
            }
        }
        load()
    }, [])
    return <>
        { (appContext.state.token.loading || loading) && <Splash />}
        { appContext.state.token.data && <Main /> }
        { !appContext.state.token.loading && !appContext.state.token.data && <Login /> }
  </>
}
