import React from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { t } from "@/i18n"
import LoadedList from "./LoadedList"
import { WhiteButton } from "./layout/lib"
import { LoadState, aboveMdWidth } from "@/lib/utils"
import { IconButton } from "react-native-paper"

interface Props {
    state: LoadState | any[]
    dataFromState?: (state: LoadState) => any[]
    displayItem: (item: I, index: number) => JSX.Element
    onAddRequested: () => void
    contentContainerStyle?: StyleProp<ViewStyle>
    onRefreshRequested?: () => void
    noDataLabel?: string
}

export const AddItemButton = ({ onAddRequested }: { onAddRequested: () => void }) => 
    <WhiteButton style={{flex: 1}} mode="outlined" icon="plus" onPress={() => onAddRequested()}>{t('add_buttonLabel')}</WhiteButton>

function AppendableList ({ state, dataFromState, displayItem, onAddRequested, contentContainerStyle, onRefreshRequested, noDataLabel }:Props) {
    return <View style={{ flexDirection: 'column', margin: 10, flex: 1, alignItems: 'center' }}>
        <View style={{ display: 'flex', flexDirection: 'row', width: aboveMdWidth() ? '60%' : '80%'  }}>
            <AddItemButton onAddRequested={onAddRequested} />
            { onRefreshRequested && <IconButton style={{ margin: 2 }} icon="refresh" onPress={onRefreshRequested} /> }
        </View>
        { Array.isArray(state) ? <LoadedList contentContainerStyle={contentContainerStyle} loading={false} error={undefined} data={state}
            displayItem={displayItem}/> :
        <LoadedList contentContainerStyle={contentContainerStyle} loading={state.loading} error={state.error} data={dataFromState!(state)} 
            displayItem={displayItem} noDataLabel={noDataLabel}/>
        }
    </View>
}

export default AppendableList