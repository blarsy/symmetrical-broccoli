import React, { useContext, useEffect, useState } from "react"
import { View } from "react-native"
import Spinner from "react-native-loading-spinner-overlay"
import { fromData, fromError, initial } from "../lib/DataLoadState"
import Login from "./Login"
import Main from "./Main"
import { AppContext } from "./AppContextProvider"
import { registerLoggedOutHandler } from "../lib/api"

export const Start = () => {
    const appContext = useContext(AppContext)
    const [tokenState, setTokenState] = useState(initial<boolean>(true))
    useEffect(() => {
        try {
            registerLoggedOutHandler(() => {
                setTokenState(fromData(false))
            })
            appContext.actions.tryRestoreToken()
            setTokenState(fromData(true))
        } catch(e: any) {
            setTokenState(fromError(e, 'Erreur lors de la sauvegarde.'))
        }
    }, [])
    return <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'stretch' }}>
        <Spinner
            visible={tokenState.loading}
            textContent={'Chargement...'}
            textStyle={{ marginTop: '8rem' }} />
        { tokenState.data && <Main /> }
        { !tokenState.loading && !tokenState.data && <Login /> }
  </View>
}
