import { NewMessage } from "@/components/chat/lib"
import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/scaffold/AppContextProvider"
import { ChatReducerActionType } from "@/components/scaffold/ChatContextProvider"
import { gql, useSubscription } from "@apollo/client"
import { useContext, useEffect } from "react"

export const NOTFICATION_RECEIVED = gql`subscription NotificationSubscription {
  notificationReceived {
    event
    notification {
      data
      id
      created
      read
    }
  }
}`

function useRealtimeNotifications() {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)

    const { data } = useSubscription(NOTFICATION_RECEIVED)

    useEffect(() => {
        if(data) {
            if(appContext.notificationCustomHandler) {
                appContext.notificationCustomHandler(data.notificationReceived.notification)
            }
        
            appDispatch({ type: AppReducerActionType.NotificationReceived, payload: data.notificationReceived.notification.id })
        }
    }, [data])
}

export default useRealtimeNotifications