import { useContext, useEffect } from "react"
import { fromData, fromError } from "../lib/DataLoadState"
import Login from "./Login"
import Main from "./Main"
import { AppContext } from "./AppContextProvider"
import { registerLoggedOutHandler } from "../lib/api"
import React from "react"
import i18n from '../i18n'
import Splash from "./Splash"

export const Start = () => {
    const { t } = i18n
    const appContext = useContext(AppContext)
    useEffect(() => {
        try {
            registerLoggedOutHandler(() => {
                appContext.actions.setTokenState(fromData(''))
            })
            appContext.actions.tryRestoreToken()
        } catch(e: any) {
            appContext.actions.setTokenState(fromError(e, t('save_error')))
        }
    }, [])
    return <>
        { appContext.state.token.loading && <Splash />}
        { appContext.state.token.data && <Main /> }
        { !appContext.state.token.loading && !appContext.state.token.data && <Login /> }
  </>
}