import { createContext, useState } from "react"
import { Condition, Image, Resource } from "@/lib/schema"
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
    setCondition: (condition: Condition) => void
    deleteCondition: (condition: Condition) => void
    setChangeCallback: (cb: () => void) => void
    addImage: (token: string, resourceId: number, img: NewOrExistingImage) => Promise<void>
    deleteImage: (token: string, resourceId: number, img: NewOrExistingImage) => Promise<void>
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

export const EditResourceContext = createContext<EditResourceContext>({
    state: { 
        editedResource: { id: 0, conditions: [], description: '', title: '', images: [], categories: [] }, 
        changeCallback: () => {},
        imagesToAdd: [],
        resources: initial(true)
    } as EditResourceState, 
    actions: {
        load: () => {},
        setResource: () => {},
        setCondition: () => {},
        deleteCondition: () => {},
        setChangeCallback: () => {},
        addImage: async() => {},
        deleteImage: async() => {},
        save: async() => {},
        reset: () => {}
    }
})

const EditResourceContextProvider = ({ children }: Props) => {
    const [editResourceState, setEditResourceState] = useState({ editedResource: { id: 0, conditions: [], description: '', expiration: undefined, title: '', images: [], categories: [] } as Resource, changeCallback: () => {} } as EditResourceState)
    
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
        setCondition: condition => {
            const targetCondition = condition.id ? editResourceState.editedResource.conditions.find(cond => cond.id === condition.id ) : undefined
            if(targetCondition) {
                targetCondition.description = condition.description
                targetCondition.title = condition.title
                setEditResourceState({ ...editResourceState })
            } else {
                setEditResourceState({ ...editResourceState, ...{ editedResource: { ...editResourceState.editedResource, ...{ conditions: [ ...editResourceState.editedResource.conditions, condition ] } } } })
                editResourceState.editedResource.conditions.push(condition)
            }
            editResourceState.changeCallback()
        },
        deleteCondition: condition => {
            const resource = editResourceState.editedResource
            if(condition.id) {
                resource.conditions = resource.conditions.filter(cond => condition.id != cond.id)
            } else {
                resource.conditions = resource.conditions.filter(cond => condition.description != cond.description || condition.title != cond.title )
            }
            
            setResource(resource)
        },
        setChangeCallback: changeCallback => setEditResourceState({ ...editResourceState, ...{ changeCallback } }),
        addImage: async (token: string, resourceId: number, img: NewOrExistingImage) => {
            if(img.blob){
                if(editResourceState.editedResource.id){
                    const resource = await uploadImagesOnResource(token, resourceId, [img])
                    setResource(resource)
                } else {
                    setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd, img ], editedResource: { ...editResourceState.editedResource, ...{ images: [ ...editResourceState.editedResource.images, img] } } }})
                    editResourceState.changeCallback()
                }
            } else {
                throw new Error('Need an image Blob')
            }
        },
        deleteImage: async (token: string, resourceId: number, img: NewOrExistingImage) => {
            if(editResourceState.editedResource.id){
                const resource = await removeImageFromResource(token, resourceId, img.path)
                setResource(resource)
            } else {
                setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd.filter(curImg => curImg.path != img.path)! ] }, editedResource: { ...editResourceState.editedResource, ...{ images: editResourceState.editedResource.images.filter(curImg => img.path != curImg.path) } } })
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
            const newResourceState = {...editResourceState, ...{ editedResource: { id: 0, title: '', expiration: undefined, description: '', images: [], conditions: [], categories: [] }, imagesToAdd: [] }}
            setEditResourceState( newResourceState )
        }
    }

    return <EditResourceContext.Provider value={{ state: editResourceState, actions}}>
        {children}
    </EditResourceContext.Provider>
}

export default EditResourceContextProvider