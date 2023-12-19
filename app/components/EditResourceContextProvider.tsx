import { createContext, useState } from "react"
import { Image, Resource } from "@/lib/schema"
import React from "react"
import { createResource, getResources, removeImageFromResource, updateResource, uploadImagesOnResource } from "@/lib/api"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { t } from "@/i18n"

interface EditResourceState {
    editedResource: Resource
    changeCallback: () => void
    imagesToAdd: NewOrExistingImage[]
    resources: DataLoadState<Resource[]>
}

export interface NewOrExistingImage extends Image{
    blob?: Blob
}

interface EditResourceActions {
    load: (token: string) => void
    setResource: (resource: Resource) => void
    setChangeCallback: (cb: () => void) => void
    addImage: (resourceState: any, token: string, resourceId: number, img: NewOrExistingImage) => Promise<void>
    deleteImage: (resourceState: any, token: string, resourceId: number, img: NewOrExistingImage) => Promise<void>
    save: (token: string, resource: Resource) => Promise<void>
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
        changeCallback: () => {},
        imagesToAdd: [],
        resources: initial(true, [])
    } as EditResourceState, 
    actions: {
        load: () => {},
        setResource: () => {},
        setChangeCallback: () => {},
        addImage: async() => {},
        deleteImage: async() => {},
        save: async() => {},
        reset: () => {}
    }
})

const EditResourceContextProvider = ({ children }: Props) => {
    const [editResourceState, setEditResourceState] = useState({ editedResource: blankResource, changeCallback: () => {} } as EditResourceState)
    
    const setResource = (resource: Resource) => {
        if(typeof(resource.expiration) === 'string')
            resource.expiration = new Date(resource.expiration as unknown as string)
        
        const newResourceState = {...editResourceState, ...{ editedResource: resource }}
        setEditResourceState( newResourceState )
        editResourceState.changeCallback()
    }

    const loadResources = async (token: string) => {
        setEditResourceState( {...editResourceState, resources: beginOperation() })
        try {
            const resources = await getResources(token)
            setEditResourceState( {...editResourceState, resources: fromData(resources) })
        } catch(e) {
            setEditResourceState( {...editResourceState, resources: fromError(e, t('requestError')) })
        }
    }

    const actions: EditResourceActions = {
        setResource,
        load: (token: string) => {
            loadResources(token)
        },
        setChangeCallback: changeCallback => setEditResourceState({ ...editResourceState, ...{ changeCallback } }),
        addImage: async (resourceState: any, token: string, resourceId: number, img: NewOrExistingImage) => {
            if(img.blob){
                if(editResourceState.editedResource.id){
                    const resource = await uploadImagesOnResource(token, resourceId, [img])
                    setResource({ ...resourceState,  ...{ images: resource.images } })
                } else {
                    setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd, img ], editedResource: { ...editResourceState.editedResource, ...resourceState, ...{ images: [ ...editResourceState.editedResource.images, img] } } }})
                    editResourceState.changeCallback()
                }
            } else {
                throw new Error('Need an image Blob')
            }
        },
        deleteImage: async (resourceState: any, token: string, resourceId: number, img: NewOrExistingImage) => {
            if(editResourceState.editedResource.id){
                const resource = await removeImageFromResource(token, resourceId, img.path)
                setResource({ ...resourceState,  ...{ images: resource.images } })
            } else {
                setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd.filter(curImg => curImg.path != img.path)! ] }, editedResource: { ...editResourceState.editedResource, ...resourceState, ...{ images: editResourceState.editedResource.images.filter(curImg => img.path != curImg.path) } } })
                editResourceState.changeCallback()
            }
        },
        save: async (token: string, resource: Resource) => {
            if(editResourceState.editedResource.id) {
                const newResource = await updateResource(token, resource)
                setResource(newResource)
            } else {
                const newResource = await createResource(token, resource)
                if(editResourceState.imagesToAdd.length > 0) {
                    const newResourceWithImage = await uploadImagesOnResource(token, newResource.id, editResourceState.imagesToAdd)
                    setEditResourceState({ imagesToAdd: [], changeCallback: editResourceState.changeCallback, editedResource: newResourceWithImage, resources: editResourceState.resources })
                    editResourceState.changeCallback()
                }
            }
            loadResources(token)
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