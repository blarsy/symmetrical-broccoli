import { createContext, useEffect, useState } from "react"
import { Category, ImageInfo, Resource } from "@/lib/schema"
import React from "react"
import { uploadImage } from "@/lib/images"
import { gql, useLazyQuery, useMutation } from "@apollo/client"
import DataLoadState, { fromData, initial, fromError } from "@/lib/DataLoadState"
import { getAuthenticatedApolloClient, getLanguage } from "@/lib/utils"
import { t } from "@/i18n"

const CREATE_RESOURCE = gql`mutation CreateResource($categoryCodes: [String], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String) {
    createResource(
      input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title}
    ) {
      integer
    }
}`

  const UPDATE_RESOURCE = gql`mutation UpdateResource($resourceId: Int, $categoryCodes: [String], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String) {
    updateResource(
      input: {resourceId: $resourceId, canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title}
    ) {
        integer
    }
}`

const GET_CATEGORIES = gql`query Categories($locale: String) {
    allResourceCategories(condition: {locale: $locale}) {
        nodes {
          code
          name
        }
      }
  }
`

interface EditResourceState {
    editedResource: Resource
    categories: DataLoadState<Category[]>
    changeCallbacks: (() => void)[]
    imagesToAdd: ImageInfo[]
}

interface EditResourceActions {
    setResource: (resource: Resource) => void
    setChangeCallback: (cb: () => void) => void
    removeChangeCallback: () => void
    addImage: (img: ImageInfo) => Promise<void>
    deleteImage: (img: ImageInfo) => Promise<void>
    save: (resource: Resource, token?: string) => Promise<void>
    reset: () => void
}

interface EditResourceContext {
    state: EditResourceState,
    actions: EditResourceActions
}

interface Props {
    children: JSX.Element
}

const blankResource: Resource = { id: 0, description: '', title: '', images: [], expiration: undefined,
    categories: [], isProduct: false, isService: false,
    canBeDelivered: false, canBeTakenAway: false,
    canBeExchanged: false,  canBeGifted: false, created: new Date() }

export const EditResourceContext = createContext<EditResourceContext>({
    state: { 
        editedResource: blankResource, 
        categories: initial(true, []),
        changeCallbacks: [],
        imagesToAdd: []
    } as EditResourceState, 
    actions: {
        setResource: () => {},
        setChangeCallback: () => {},
        removeChangeCallback: () => {},
        addImage: async() => {},
        deleteImage: async() => {},
        save: async() => {},
        reset: () => {}
    }
})

const EditResourceContextProvider = ({ children }: Props) => {
    const [editResourceState, setEditResourceState] = useState({ editedResource: blankResource, imagesToAdd: [], changeCallbacks: [], categories: initial<Category[]>(true, []) } as EditResourceState)
    const [createResource] = useMutation(CREATE_RESOURCE)
    const [updateResource] = useMutation(UPDATE_RESOURCE)
    const [getCategories] = useLazyQuery(GET_CATEGORIES)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getCategories({ variables: { locale: getLanguage() }})
                setEditResourceState({ ...editResourceState, categories: fromData(res.data.allResourceCategories.nodes) })
            } catch(e) {
                setEditResourceState({ ...editResourceState, categories: fromError(e, t('requestError')) })
            }
        }

        load()
    }, [])
    
    const setResource = (resource: Resource) => {
        if(typeof(resource.expiration) === 'string')
            resource.expiration = new Date(resource.expiration as unknown as string)
        
        const newResourceState = {...editResourceState, ...{ editedResource: resource }}
        setEditResourceState( newResourceState )
        editResourceState.changeCallbacks.forEach(cb => cb())
    }

    const actions: EditResourceActions = {
        setResource,
        setChangeCallback: changeCallback => {
            editResourceState.changeCallbacks.push(changeCallback)
            setEditResourceState({ ...editResourceState })
        },
        removeChangeCallback: () => {
            editResourceState.changeCallbacks.pop()
            setEditResourceState({ ...editResourceState })
        },
        addImage: async (img: ImageInfo) => {
            if(!img.path) throw new Error('Image has not local path')

            setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd, img ], editedResource: { ...editResourceState.editedResource, ...{ images: [ ...editResourceState.editedResource.images, img] } } }})
            editResourceState.changeCallbacks.forEach(cb => cb())
        },
        deleteImage: async (img: ImageInfo) => {
            let updatedImagesToAdd = editResourceState.imagesToAdd
            let updatedImages = editResourceState.editedResource.images
            if(img.path){
                updatedImagesToAdd = updatedImagesToAdd.filter(curImg => curImg.path != img.path)
                updatedImages = updatedImages.filter(curImg => curImg.path != img.path)
            } else {
                updatedImages = updatedImages.filter(curImg => curImg.publicId != img.publicId)
            }
            setEditResourceState({ ...editResourceState, ...{ imagesToAdd: updatedImagesToAdd }, editedResource: { ...editResourceState.editedResource, ...{ images: updatedImages } } })
            editResourceState.changeCallbacks.forEach(cb => cb())
        },
        save: async (resource: Resource, token?: string) => {
            if(editResourceState.editedResource.id) {
                if(editResourceState.imagesToAdd.length > 0) {
                    const newPublicIds = await Promise.all(editResourceState.imagesToAdd.map(async img => { 
                        return await uploadImage(img.path!)
                    }))
                    resource.images = resource.images.filter(curImg => !curImg.path)
                    resource.images.push(...newPublicIds.map(publicId => ({ publicId } as ImageInfo)))
                }

                await updateResource({ variables: {
                    resourceId: resource.id,
                    title: resource.title,
                    description: resource.description,
                    expiration: resource.expiration,
                    isProduct: resource.isProduct,
                    isService: resource.isService,
                    canBeDelivered: resource.canBeDelivered,
                    canBeExchanged: resource.canBeExchanged,
                    canBeTakenAway: resource.canBeTakenAway,
                    canBeGifted: resource.canBeGifted,
                    categoryCodes: resource.categories.map(cat => cat.code.toString()),
                    imagesPublicIds: resource.images.map(img => img.publicId)
                }})
                setEditResourceState({ ...editResourceState, imagesToAdd: [], editedResource: resource })
            } else {
                let imagesPublicIds: string[] = []
                if(editResourceState.imagesToAdd.length > 0) {
                    imagesPublicIds = await Promise.all(editResourceState.imagesToAdd.map(img => uploadImage(img.path!)))
                }

                const variables = {
                    title: resource.title,
                    description: resource.description,
                    expiration: resource.expiration,
                    isProduct: resource.isProduct,
                    isService: resource.isService,
                    canBeDelivered: resource.canBeDelivered,
                    canBeExchanged: resource.canBeExchanged,
                    canBeTakenAway: resource.canBeTakenAway,
                    canBeGifted: resource.canBeGifted,
                    categoryCodes: resource.categories.map(cat => cat.code.toString()),
                    imagesPublicIds
                }

                if(!token) {
                    await createResource({ variables })
                } else {
                    await createResource({ variables, client: getAuthenticatedApolloClient(token) })
                }

                resource.images = imagesPublicIds.map(pId => ({ publicId: pId }))
                setEditResourceState({ ...editResourceState, imagesToAdd: [], editedResource: resource })
            }
            editResourceState.changeCallbacks.forEach(cb => cb())
        },
        reset: () => {
            const newResourceState = {...editResourceState, ...{ editedResource: blankResource, imagesToAdd: [] }}
            setEditResourceState( newResourceState )
        }
    }

    return <EditResourceContext.Provider value={{ state: editResourceState, actions}}>
        {children}
    </EditResourceContext.Provider>
}

export default EditResourceContextProvider