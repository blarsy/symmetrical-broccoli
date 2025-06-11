"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import LoadedZone from "@/components/scaffold/LoadedZone"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { usePagePath } from "@/lib/utils"
import { gql, useLazyQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import { AppContext } from "@/components/scaffold/AppContextProvider"
import EditResource from "@/components/resources/EditResource"

const GET_RESOURCE = gql`query GetResource($id: Int!) {
    resourceById(id: $id) {
      accountByAccountId {
        email
        id
        name
        willingToContribute
        imageByAvatarImageId {
          publicId
        }
      }
      canBeDelivered
      canBeExchanged
      canBeGifted
      canBeTakenAway
      description
      id
      isProduct
      isService
      expiration
      title
      resourcesResourceCategoriesByResourceId {
        nodes {
          resourceCategoryCode
        }
      }
      resourcesImagesByResourceId {
        nodes {
          imageByImageId {
            publicId
          }
        }
      }
      locationBySpecificLocationId {
        address
        latitude
        longitude
        id
      }
      suspended
      paidUntil
      created
      deleted
      subjectiveValue
    }
}`

const Wrapped = (p: { resourceId: number }) => {
    const [resource, setResource] = useState<DataLoadState<Resource | undefined>>(initial(true, undefined))
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const categories = useCategories()
    const appContext = useContext(AppContext)

    const loadResource = async () => {
        try {
            if(p.resourceId != 0 && categories.data) {
                const rawRes = await getResource({ variables: { id: Number(p.resourceId) } })
                setResource(fromData(fromServerGraphResource(rawRes.data.resourceById, categories.data)))
            } else {
                setResource(fromData(undefined))
            }
        } catch (e) {
            setResource(fromError(e, appContext.i18n.translator('requestError')))
        }
    }
    useEffect(() => {
        if(categories.data) loadResource()
    }, [categories.data])

    return <LoadedZone loading={resource.loading} error={resource.error} containerStyle={{ overflow: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <EditResource value={resource.data}/>
    </LoadedZone>
}

const Page = () => {
    const { version, param } = usePagePath()

    return <ConnectedLayout version={version} allowAnonymous>
        <Wrapped resourceId={Number(param)} />
    </ConnectedLayout>
}

export default Page