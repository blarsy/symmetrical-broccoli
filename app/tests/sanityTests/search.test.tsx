import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { AppWithScreens } from "./lib"
import { SearchResults } from "@/components/mainViews/Search"
import '@testing-library/react-native/extend-expect'
import { cleanupSearchableResources, getTestNum, setupSearchableResources } from "./datastoreSetupLib"

let searchableData: {
    accounts: {
        name: string;
        token: string;
    }[];
    resourceIds: [number, number, number, number, number, number];
}

beforeAll(async () => {
    searchableData = await setupSearchableResources(getTestNum())
})

afterAll(async () => cleanupSearchableResources(searchableData))

test('Search on resource text', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }]} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    fireEvent.changeText(screen.getByTestId('searchText'), `${searchableData.accounts[0].name}`)

    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).toHaveTextContent(`${searchableData.accounts[0].name}-2`), { interval: 400, timeout: 2000 })
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).toHaveTextContent(`${searchableData.accounts[0].name}-3`)
    
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()

    fireEvent.changeText(screen.getByTestId('searchText'), `${searchableData.accounts[1].name}`)

    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).toHaveTextContent(`${searchableData.accounts[1].name}-2`), { interval: 400, timeout: 2000 })
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).toHaveTextContent(`${searchableData.accounts[1].name}-3`)
    
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
})

test('Search on resource categories', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }]} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    fireEvent.press(screen.getByTestId('categories:Button'))
    await waitFor(() => expect(screen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
    fireEvent.press(screen.getByTestId(`categories:Modal:Category:${2}`))

    fireEvent.press(screen.getByTestId('categories:Modal:ConfirmButton'))
   
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).toHaveTextContent(`${searchableData.accounts[0].name}-3`))
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).toHaveTextContent(`${searchableData.accounts[1].name}-2`)
    
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).not.toBeOnTheScreen()
})

test('Search on resource attributes', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }]} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    fireEvent.press(screen.getByTestId('attributesAccordion:Button'))
    await waitFor(() => expect(screen.getByTestId('nature:isProduct:Button')).toBeOnTheScreen())
    fireEvent.press(screen.getByTestId(`nature:isProduct:Button`))
    fireEvent.press(screen.getByTestId(`transport:canBeDelivered:Button`))
    fireEvent.press(screen.getByTestId(`exchangeType:canBeExchanged:Button`))
   
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).toHaveTextContent(`${searchableData.accounts[0].name}-2`))
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).toHaveTextContent(`${searchableData.accounts[1].name}-3`)
    
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).not.toBeOnTheScreen()

    fireEvent.press(screen.getByTestId(`nature:isService:Button`))
   
    await waitFor(() => expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).not.toBeOnTheScreen())
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).toHaveTextContent(`${searchableData.accounts[1].name}-3`))
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).not.toBeOnTheScreen()
    
})