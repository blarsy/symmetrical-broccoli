import { createContext, useState } from "react"
import { Condition, Image, Resource } from "@/lib/schema"
import React from "react"
import { createResource, removeImageFromResource, updateResource, uploadImagesOnResource } from "@/lib/api"

interface EditResourceState {
    resource: Resource
    changeCallback: () => void
    imagesToAdd: { path: string, blob: Blob}[]
}

export interface NewOrExistingImage extends Image{
    blob?: Blob
}

interface EditResourceActions {
    setResource: (resource: Resource) => void,
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
        resource: { id: 0, conditions: [], description: '', title: '', images: [] }, 
        changeCallback: () => {},
        imagesToAdd: []
    } as EditResourceState, 
    actions: {
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
    const [editResourceState, setEditResourceState] = useState({ resource: { id: 0, conditions: [], description: '', title: '', images: [] } as Resource, changeCallback: () => {} } as EditResourceState)
    
    const setResource = (resource: Resource) => {
        if(typeof(resource.expiration) === 'string')
            resource.expiration = new Date(resource.expiration as unknown as string)
        
        const newResourceState = {...editResourceState, ...{ resource }}
        setEditResourceState( newResourceState )
        editResourceState.changeCallback()
    }
    const actions: EditResourceActions = {
        setResource,
        setCondition: condition => {
            const targetCondition = condition.id ? editResourceState.resource.conditions.find(cond => cond.id === condition.id ) : undefined
            if(targetCondition) {
                targetCondition.description = condition.description
                targetCondition.title = condition.title
                setEditResourceState({ ...editResourceState })
            } else {
                setEditResourceState({ ...editResourceState, ...{ resource: { ...editResourceState.resource, ...{ conditions: [ ...editResourceState.resource.conditions, condition ] } } } })
                editResourceState.resource.conditions.push(condition)
            }
            editResourceState.changeCallback()
        },
        deleteCondition: condition => {
            const resource = editResourceState.resource
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
                if(editResourceState.resource.id){
                    const resource = await uploadImagesOnResource(token, resourceId, [img.blob])
                    setResource(resource)
                } else {
                    setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd, { path: img.path, blob: img.blob! } ], resource: { ...editResourceState.resource, ...{ images: [ ...editResourceState.resource.images, img] } } }})
                    editResourceState.changeCallback()
                }
            } else {
                throw new Error('Need an image Blob')
            }
        },
        deleteImage: async (token: string, resourceId: number, img: NewOrExistingImage) => {
            if(editResourceState.resource.id){
                const resource = await removeImageFromResource(token, resourceId, img.path)
                setResource(resource)
            } else {
                setEditResourceState({ ...editResourceState, ...{ imagesToAdd: [ ...editResourceState.imagesToAdd.filter(curImg => curImg.path != img.path)! ] }})
                editResourceState.changeCallback()
            }
        },
        save: async (token: string, resource: Resource) => {
            if(editResourceState.resource.id) {
                const newResource = await updateResource(token, resource)
                setResource(newResource)
            } else {
                const newResource = await createResource(token, resource)
                if(editResourceState.imagesToAdd.length > 0) {
                    const newResourceWithImage = await uploadImagesOnResource(token, newResource.id, editResourceState.imagesToAdd.map(img => img.blob))
                    setEditResourceState({ imagesToAdd: [], changeCallback: editResourceState.changeCallback, resource: newResourceWithImage })
                    editResourceState.changeCallback()
                }
            }
        },
        reset: () => {
            const newResourceState = {...editResourceState, ...{ resource: { id: 0, title: '', description: '', images: [], conditions: [] }, imagesToAdd: [] }}
            setEditResourceState( newResourceState )
        }
    }

    return <EditResourceContext.Provider value={{ state: editResourceState, actions}}>
        {children}
    </EditResourceContext.Provider>
}

export default EditResourceContextProvider