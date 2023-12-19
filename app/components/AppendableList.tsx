import React from "react"
import { Dimensions, StyleProp, View, ViewStyle } from "react-native"
import { Button } from "react-native-paper"
import { t } from "@/i18n"
import DataLoadState from "@/lib/DataLoadState"
import LoadedList from "./LoadedList"
import { WhiteButton } from "./layout/lib"
import { aboveMdWidth } from "@/lib/utils"

interface Props<T, I> {
    state: DataLoadState<T> | I[]
    dataFromState?: (state: DataLoadState<T>) => I[],
    displayItem: (item: I, index: number) => JSX.Element,
    onAddRequested: () => void,
    contentContainerStyle?: StyleProp<ViewStyle>
}

function AppendableList<T, I> ({ state, dataFromState, displayItem, onAddRequested, contentContainerStyle }:Props<T, I>) {
    return <View style={{ flexDirection: 'column', margin: 10, flex:1, alignItems: 'center' }}>
        <WhiteButton style={{ width: aboveMdWidth() ? '60%' : '80%' }} mode="outlined" icon="plus" onPress={() => onAddRequested()}>{t('add_buttonLabel')}</WhiteButton>
        { state instanceof DataLoadState ? <LoadedList contentContainerStyle={contentContainerStyle} loading={state.loading} error={state.error} data={dataFromState!(state)} 
            displayItem={displayItem}/> :
        <LoadedList loading={false} error={undefined} data={state}
            displayItem={displayItem}/>
        }
    </View>
}

export default AppendableList