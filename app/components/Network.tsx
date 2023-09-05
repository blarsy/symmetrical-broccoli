import React, { useContext, useEffect, useState } from "react"
import { fromData, fromError, initial } from "../lib/DataLoadState"
import { Account } from "../lib/schema"
import { getNetwork } from "../lib/api"
import { AppContext } from "./AppContextProvider"
import { t } from "i18next"
import ListOf from "./ListOf"
import { ActivityIndicator, List, Snackbar } from "react-native-paper"

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
        return <Snackbar visible={!!friends.error && !!friends.error.message} onDismiss={() => setFriends(initial<Account[]>(false))}>{friends.error.message}</Snackbar>
    } else if(friends.loading){
        return <ActivityIndicator />
    } else {
        return <>
            <ListOf data={friends.data} displayItem={friend => <List.Item title={friend.name} />}/>
        </>
    }
}

export default Network