import { ListItem, Snackbar, Text } from "@react-native-material/core"
import React, { useContext, useEffect, useState } from "react"
import { fromData, fromError, initial } from "../lib/DataLoadState"
import { Account } from "../lib/schema"
import { getNetwork } from "../lib/api"
import { AppContext } from "./AppContextProvider"
import { t } from "i18next"
import Spinner from "react-native-loading-spinner-overlay"
import ListOf from "./ListOf"

const Network = () => {
    const appContext = useContext(AppContext)
    const [friends, setFriends] = useState(initial<Account[]>(true))

    const loadFriends = async () => {
        try {
            const res = await getNetwork(appContext.state.token.data!)
            setFriends(fromData(res))
        } catch(e) {
            setFriends(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadFriends()
    }, [])
    
    if( friends.error && friends.error.message ) {
        return <Snackbar message={friends.error.message} />
    } else if(friends.loading){
        return <Spinner
            textContent={t('loading')}
            visible />
    } else {
        return <>
            <ListOf data={friends.data} displayItem={friend => <ListItem title={friend.name} />}/>
        </>
    }
}

export default Network