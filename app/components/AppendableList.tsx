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
    noDataLabel?: string | JSX.Element
}

export const AddItemButton = ({ onAddRequested, style }: { onAddRequested: () => void, style?: ViewStyle }) => 
    <WhiteButton style={{flex: 1, ...style}} mode="outlined" icon="plus" onPress={() => onAddRequested()}>{t('add_buttonLabel')}</WhiteButton>

function AppendableList ({ state, dataFromState, displayItem, onAddRequested, contentContainerStyle, onRefreshRequested, noDataLabel }:Props) {
    return <View style={{ flexDirection: 'column', margin: 10, flex: 1, alignItems: 'stretch' }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', position: 'relative'  }}>
            <AddItemButton style={{ flexGrow: 0, flexShrink: 0, flexBasis: aboveMdWidth() ? '60%' : '70%' }} onAddRequested={onAddRequested} />
            { onRefreshRequested && <IconButton style={{ margin: 2, position: 'absolute', right: 0 }} icon="refresh" onPress={onRefreshRequested} /> }
        </View>
        { Array.isArray(state) ? <LoadedList contentContainerStyle={contentContainerStyle} loading={false} error={undefined} data={state}
            displayItem={displayItem}/> :
        <LoadedList contentContainerStyle={contentContainerStyle} loading={state.loading} error={state.error} data={dataFromState!(state)} 
            displayItem={displayItem} noDataLabel={noDataLabel}/>
        }
    </View>
}

export default AppendableList