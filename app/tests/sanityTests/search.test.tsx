import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { AppWithScreens } from "./lib"
import { SearchResults } from "@/components/mainViews/Search"
import { cleanupSearchableResources, getTestNum, SearchableResources, searchableResourceTitles, setupSearchableResources } from "./datastoreSetupLib"

let searchableData: SearchableResources

beforeAll(async () => {
    searchableData = await setupSearchableResources(getTestNum())
})

afterAll(async () => {
    cleanupSearchableResources(searchableData)
})

test('Search on resource text (account name)', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }]} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    fireEvent.changeText(screen.getByTestId('searchText'), `${searchableData.accounts[0].name}`)

    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`))
        .toHaveTextContent(searchableResourceTitles[0]), { timeout: 5000 })
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`))
        .toHaveTextContent(searchableResourceTitles[1])
    
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()

    fireEvent.changeText(screen.getByTestId('searchText'), `${searchableData.accounts[1].name}`)

    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`))
        .toHaveTextContent(searchableResourceTitles[2]))
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`))
        .toHaveTextContent(searchableResourceTitles[3])

    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
})

const searchAndCheck = async (term: string, match: [number, number], nonMatches: number[]) => {
    fireEvent.changeText(screen.getByTestId('searchText'), term)
    
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[match[1]]}:Title`))
        .toHaveTextContent(searchableResourceTitles[match[0]]), { timeout: 5000 })
    
    nonMatches.forEach(i => expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[i]}:Title`)).not.toBeOnTheScreen())
}

test('Search on resource text (title)', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }]} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    await searchAndCheck('pot', [0, 1], [2, 4, 5])
    await searchAndCheck('pokemon', [1, 2], [1, 4, 5])
    await searchAndCheck('weck', [0, 1], [2, 4, 5])
    await searchAndCheck('pokemon 151', [1, 2], [1, 4, 5])
    await searchAndCheck('Siège bureau', [2, 4], [1, 2, 5])
    await searchAndCheck('Porsche', [2, 4], [1, 2, 5])
    await searchAndCheck('Jante', [3, 5], [1, 2, 4])
    await searchAndCheck('Jante 5 112', [3, 5], [1, 2, 4])
})

test('Search on resource categories', async () => {
    render(<AppWithScreens screens={[{ component: SearchResults, name: 'searchResults' }]} />)

    await waitFor(() => expect(screen.getByTestId('categories:Button')).toBeOnTheScreen())

    fireEvent.press(screen.getByTestId('categories:Button'))
    await waitFor(() => expect(screen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
    fireEvent.press(screen.getByTestId(`categories:Modal:Category:2`))

    fireEvent.press(screen.getByTestId('categories:Modal:ConfirmButton'))
   
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).toHaveTextContent(searchableResourceTitles[1]), { timeout: 5000 })
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).toHaveTextContent(searchableResourceTitles[2])
    
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
    
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).toHaveTextContent(searchableResourceTitles[0]), { timeout: 5000 })
    expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).toHaveTextContent(searchableResourceTitles[3])
    
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).not.toBeOnTheScreen()

    fireEvent.press(screen.getByTestId(`nature:isService:Button`))
    
    await waitFor(() => expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[1]}:Title`)).not.toBeOnTheScreen())
    await waitFor(() => expect(screen.getByTestId(`FoundResource:${searchableData.resourceIds[5]}:Title`)).toHaveTextContent(searchableResourceTitles[3]))
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[0]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[2]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[3]}:Title`)).not.toBeOnTheScreen()
    expect(screen.queryByTestId(`FoundResource:${searchableData.resourceIds[4]}:Title`)).not.toBeOnTheScreen()
    
})