import React from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { t } from "@/i18n"
import LoadedList from "./LoadedList"
import { WhiteButton } from "./layout/lib"
import { LoadState, aboveMdWidth } from "@/lib/utils"

interface Props {
    state: LoadState | any[]
    dataFromState?: (state: LoadState) => any[],
    displayItem: (item: I, index: number) => JSX.Element,
    onAddRequested: () => void,
    contentContainerStyle?: StyleProp<ViewStyle>
}

export const AddItemButton = ({ onAddRequested }: { onAddRequested: () => void }) => 
    <WhiteButton style={{ width: aboveMdWidth() ? '60%' : '80%' }} mode="outlined" icon="plus" onPress={() => onAddRequested()}>{t('add_buttonLabel')}</WhiteButton>

function AppendableList ({ state, dataFromState, displayItem, onAddRequested, contentContainerStyle }:Props) {
    return <View style={{ flexDirection: 'column', margin: 10, flex:1, alignItems: 'center' }}>
        <AddItemButton onAddRequested={onAddRequested} />
        { Array.isArray(state) ? <LoadedList contentContainerStyle={contentContainerStyle} loading={false} error={undefined} data={state}
            displayItem={displayItem}/> :
        <LoadedList contentContainerStyle={contentContainerStyle} loading={state.loading} error={state.error} data={dataFromState!(state)} 
            displayItem={displayItem}/>
        }
    </View>
}

export default AppendableList