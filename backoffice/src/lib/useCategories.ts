import { gql, useLazyQuery } from "@apollo/client"
import { useContext, useEffect } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/scaffold/AppContextProvider"
import { fromData, fromError, initial } from "./DataLoadState"

export const GET_CATEGORIES = gql`query Categories($locale: String) {
    allResourceCategories(condition: {locale: $locale}) {
        nodes {
          code
          name
        }
      }
  }
`

function useCategories () {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [getCategories] = useLazyQuery(GET_CATEGORIES)

    const loadCategories = async (lang: string) => {
        try {
            appDispatch({ type: AppReducerActionType.SetCategoriesState, payload: initial(true, undefined) })
            const res = await getCategories({ variables: { locale: lang } })
            appDispatch({ type: AppReducerActionType.SetCategoriesState, payload: fromData(res.data.allResourceCategories.nodes) })
        } catch(e) {
            appDispatch({ type: AppReducerActionType.SetCategoriesState, payload: fromError(e, appContext.i18n.translator('requestError')) })
        }
    }

    useEffect(() => {
        if(!appContext.categories.data && !appContext.categories.loading) {
            loadCategories(appContext.i18n.lang)
        }
    }, [appContext.i18n.lang])

    return appContext.categories
}

export default useCategories