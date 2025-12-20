import { ReactNode, SetStateAction, createContext, useState } from "react"
import { ImageInfo, Location, Resource } from "@/lib/schema"
import React from "react"
import { uploadImage } from "@/lib/images"
import { gql, useMutation } from "@apollo/client"
import { GraphQlLib } from "@/lib/backendFacade"

export  const UPDATE_RESOURCE = gql`mutation UpdateResource($resourceId: Int, $categoryCodes: [Int], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String, $specificLocation: NewLocationInput = {}, $price: Int, $campaignToJoin: Int) {
  updateResource(
    input: {resourceId: $resourceId, canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title, specificLocation: $specificLocation, price: $price, campaignToJoin: $campaignToJoin}
  ) {
    integer
  }
}`

interface EditResourceState {
    editedResource: Resource
    campaignToJoin?: number
    changeCallbacks: (() => void)[]
    imagesToAdd: ImageInfo[]
}

interface EditResourceActions {
    setResource: (resource: Resource) => void
    setChangeCallback: (cb: () => void) => void
    removeChangeCallback: () => void
    addImage: (img: ImageInfo, resource: Resource) => Promise<void>
    deleteImage: (img: ImageInfo, resource: Resource) => Promise<void>
    save: (resource: Resource) => Promise<void>
    reset: (accountLocation?: Location, joinCampaign?: boolean) => void
    setCampaignToJoin: (campaignId?: number) => void
}

export interface EditResourceContextProps {
    state: EditResourceState,
    actions: EditResourceActions
}

interface Props {
    children: ReactNode
}

const blankResource: Resource = { id: 0, description: '', title: '', images: [], expiration: new Date(),
    categories: [], isProduct: false, isService: false,
    canBeDelivered: false, canBeTakenAway: false,
    canBeExchanged: false,  canBeGifted: false, created: new Date(), deleted: null, specificLocation: null,
    price: null, inActiveCampaign: false
}

export const EditResourceContext = createContext<EditResourceContextProps>({
    state: { 
        editedResource: blankResource, 
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
        reset: (accountLocation?: Location, joinCampaign?: boolean) => {},
        setCampaignToJoin: (campaignId => {})
    }
})

const EditResourceContextProvider = ({ children }: Props) => {
    const [editResourceState, setEditResourceState] = useState({ editedResource: blankResource, 
        campaignToJoin: undefined, imagesToAdd: [], changeCallbacks: [] } as EditResourceState)
    const [createResource] = useMutation(GraphQlLib.mutations.CREATE_RESOURCE)
    const [updateResource] = useMutation(UPDATE_RESOURCE)

    const setState = (value: SetStateAction<EditResourceState>) => {
        setEditResourceState(value)
    }

    const getResourceWithExpiration = (resource: Resource) => {
        if(typeof(resource.expiration) === 'string')
            resource.expiration = new Date(resource.expiration as unknown as string)
        
        return resource
    }
    
    const setResource = (resource: Resource) => {
        setState( {...editResourceState, ...{ editedResource: getResourceWithExpiration(resource) } })
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
        addImage: async (img: ImageInfo, resource: Resource) => {
            if(!img.path) throw new Error('Image has not local path')

            setState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd, img ], editedResource: { ...getResourceWithExpiration(resource), ...{ images: [ ...editResourceState.editedResource.images, img] } } }})
        },
        deleteImage: async (img: ImageInfo, resource: Resource) => {
            let updatedImagesToAdd = editResourceState.imagesToAdd
            let updatedImages = editResourceState.editedResource.images
            if(img.path){
                updatedImagesToAdd = updatedImagesToAdd.filter(curImg => curImg.path != img.path)
                updatedImages = updatedImages.filter(curImg => curImg.path != img.path)
            } else {
                updatedImages = updatedImages.filter(curImg => curImg.publicId != img.publicId)
            }
            setState({ ...editResourceState, ...{ imagesToAdd: updatedImagesToAdd }, editedResource: { ...getResourceWithExpiration(resource), ...{ images: updatedImages } } })
        },
        save: async (resource: Resource) => {
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
                    categoryCodes: resource.categories.map(cat => cat.code),
                    imagesPublicIds: resource.images.map(img => img.publicId),
                    specificLocation: resource.specificLocation,
                    price: resource.price || null,
                    campaignToJoin: resource.inActiveCampaign ? editResourceState.campaignToJoin : undefined
                }})
                setState({ ...editResourceState, imagesToAdd: [], editedResource: resource })
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
                    categoryCodes: resource.categories.map(cat => cat.code),
                    imagesPublicIds,
                    specificLocation: resource.specificLocation,
                    price: resource.price || null,
                    campaignToJoin: resource.inActiveCampaign ? editResourceState.campaignToJoin : undefined
                }

                await createResource({ variables })

                resource.images = imagesPublicIds.map(pId => ({ publicId: pId }))
                setState({ ...editResourceState, imagesToAdd: [], editedResource: resource })
            }
            editResourceState.changeCallbacks.forEach(cb => cb())
        },
        reset: (accountLocation?: Location, joinCampaign?: boolean) => {
            const newResource = { ...blankResource }
            newResource.specificLocation = accountLocation || null
            if(joinCampaign) newResource.inActiveCampaign = true
            
            const newResourceState = {...editResourceState, ...{ editedResource: newResource, imagesToAdd: [] }}
            setState( newResourceState )
        },
        setCampaignToJoin: (campaignToJoin?: number) => {
            setState(prev => ({ ...prev, ...{ campaignToJoin } }))
        }
    }

    return <EditResourceContext.Provider value={{ state: editResourceState, actions}}>
        {children}
    </EditResourceContext.Provider>
}

export default EditResourceContextProvider