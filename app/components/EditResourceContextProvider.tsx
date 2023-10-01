import { createContext, useState } from "react"
import { Condition, Resource } from "@/lib/schema"
import React from "react"

interface EditResourceState {
    resource: Resource,
    changeCallback: () => void
}

interface EditResourceActions {
    setResource: (resource: Resource) => void,
    setCondition: (condition: Condition) => void
    deleteCondition: (condition: Condition) => void
    setChangeCallback: (cb: () => void) => void
}

interface EditResourceContext {
    state: EditResourceState,
    actions: EditResourceActions
}

interface Props {
    children: JSX.Element
}

export const EditResourceContext = createContext<EditResourceContext>({
    state: { resource: { id: 0, conditions: [], description: '', title: '', images: [] }, changeCallback: () => {} } as EditResourceState, 
    actions: {
        setResource: () => {},
        setCondition: () => {},
        deleteCondition: () => {},
        setChangeCallback: () => {}
    }
})

const EditResourceContextProvider = ({ children }: Props) => {
    const [editResourceState, setEditResourceState] = useState({ resource: { id: 0, conditions: [], description: '', title: '', images: [] } as Resource, changeCallback: () => {} } as EditResourceState)
    const actions: EditResourceActions = {
        setResource: resource => {
            if(typeof(resource.expiration) === 'string')
                resource.expiration = new Date(resource.expiration as unknown as string)
            
            const newResourceState = {...editResourceState, ...{ resource }}
            setEditResourceState( newResourceState )
            editResourceState.changeCallback()
        },
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
            
            setEditResourceState({ ...editResourceState, ...{ resource } })
            editResourceState.changeCallback()
        },
        setChangeCallback: changeCallback => setEditResourceState({ ...editResourceState, ...{ changeCallback } })
    }

    return <EditResourceContext.Provider value={{ state: editResourceState, actions}}>
        {children}
    </EditResourceContext.Provider>
}

export default EditResourceContextProvider