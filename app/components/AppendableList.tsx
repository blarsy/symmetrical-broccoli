import React from "react"
import { View } from "react-native"
import { Button } from "react-native-paper"
import { t } from "@/i18n"
import DataLoadState from "@/lib/DataLoadState"
import LoadedList from "./LoadedList"

interface Props<T, I> {
    state: DataLoadState<T> | I[]
    dataFromState?: (state: DataLoadState<T>) => I[],
    displayItem: (item: I, index: number) => JSX.Element,
    onAddRequested: () => void
}

function AppendableList<T, I> ({ state, dataFromState, displayItem, onAddRequested }:Props<T, I>) {
    return <View style={{ flexDirection: 'column', margin: 10, flex:1 }}>
        <Button mode="outlined" labelStyle={{ textTransform: 'uppercase', color: '#000' }} icon="plus" onPress={() => onAddRequested()}>{t('add_buttonLabel')}</Button>
        { state instanceof DataLoadState ? <LoadedList loading={state.loading} error={state.error} data={dataFromState!(state)} 
            displayItem={displayItem}/> :
        <LoadedList loading={false} error={undefined} data={state}
            displayItem={displayItem}/>
        }
    </View>
}

export default AppendableList