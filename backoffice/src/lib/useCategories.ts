import { gql, useLazyQuery } from "@apollo/client"
import { useContext, useEffect } from "react"
import { fromData, fromError, initial } from "./DataLoadState"
import { UiContext, UiDispatchContext, UiReducerActionType } from "@/components/scaffold/UiContextProvider"

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
    const uiContext = useContext(UiContext)
    const uiDispatch = useContext(UiDispatchContext)
    const [getCategories] = useLazyQuery(GET_CATEGORIES)

    const loadCategories = async (lang: string) => {
        try {
            uiDispatch({ type: UiReducerActionType.SetCategoriesState, payload: initial(true, undefined) })
            const res = await getCategories({ variables: { locale: lang } })
            uiDispatch({ type: UiReducerActionType.SetCategoriesState, payload: fromData(res.data.allResourceCategories.nodes) })
        } catch(e) {
            uiDispatch({ type: UiReducerActionType.SetCategoriesState, payload: fromError(e, uiContext.i18n.translator('requestError')) })
        }
    }

    useEffect(() => {
        if(!uiContext.categories.data && !uiContext.categories.loading) {
            loadCategories(uiContext.i18n.lang)
        }
    }, [uiContext.i18n.lang])

    return uiContext.categories
}

export default useCategories