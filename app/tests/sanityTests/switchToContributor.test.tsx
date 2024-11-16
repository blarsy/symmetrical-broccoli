import { render, screen } from "@testing-library/react-native"
import { createAndLogIn, createResource, getTestNum } from "./datastoreSetupLib"
import { AppWithSingleScreen } from "./lib"
import EditResource from "@/components/form/EditResource"
import React from "react"
import { createResourceThroughUI } from "./createResources.test"

const testNum = getTestNum()
const email = `me${testNum}@me.com`, password= 'Password1!', name = `me${testNum}`
const resName = `${name}-res`

test(`become contributor when creating one's 3rd resource`, async () => {
    const token = await createAndLogIn(email, name, password, true)

    await Promise.all([
        createResource(token, resName, 'description', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [1]),
        createResource(token, resName + '2', 'description2', true, false, true, true, true, false, new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), [2]),
    ])

    render(<AppWithSingleScreen component={EditResource} name="editResource" 
        overrideSecureStore={{ get: async () => token, set: async () => {}, remove: async () => {} }} />)

    await createResourceThroughUI(resName + '3', 'description', new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 30), screen, false)

    //Check the switch to contribution mode screen is displayed
})