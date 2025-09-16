import React, { ReactNode } from "react"
import { Platform, StyleProp, View, ViewStyle } from "react-native"
import { t } from "@/i18n"
import LoadedList from "./LoadedList"
import { WhiteButton } from "./layout/lib"
import { LoadState, aboveMdWidth } from "@/lib/utils"
import { IconButton } from "react-native-paper"
import Images from "@/Images"

interface Props<I> {
    state: LoadState | I[]
    dataFromState?: (state: LoadState) => I[]
    displayItem: (item: I, index: number) => ReactNode
    onAddRequested: () => void
    contentContainerStyle?: StyleProp<ViewStyle>
    onRefreshRequested?: () => void
    noDataLabel?: string | ReactNode
    testID?: string
}

function AppendableList<I> ({ state, dataFromState, displayItem, onAddRequested, contentContainerStyle, onRefreshRequested, noDataLabel, testID }:Props<I>) {
    return <View style={{ flexDirection: 'column', margin: 10, flex: 1, alignItems: 'stretch' }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', position: 'relative'  }}>
            {/* Strange bug on IOS: flexBasis is applied on the wrong axis (thus we have a button covering 60% ... of the screen height). So, on IOS we give some vertical padding to make the button moretheless larger */}
            <WhiteButton style={Platform.OS === "android" ? { flexGrow: 0, flexShrink: 0, flexBasis: aboveMdWidth() ? '60%' : '70%' } : { paddingHorizontal: '15%' }} 
                mode="outlined" icon="plus" testID={`${testID}:addButton`}
                onPress={() => onAddRequested()}>{t('add_buttonLabel')}</WhiteButton>
            { onRefreshRequested && <IconButton style={{ margin: 7, position: 'absolute', right: 0, borderRadius: 0}} size={15} icon={Images.Refresh} onPress={onRefreshRequested} /> }
        </View>
        { Array.isArray(state) ? <LoadedList contentContainerStyle={contentContainerStyle} loading={false} error={undefined} data={state}
            displayItem={displayItem}/> :
        <LoadedList contentContainerStyle={contentContainerStyle} loading={state.loading} error={state.error} data={dataFromState!(state)} 
            displayItem={displayItem} noDataLabel={noDataLabel}/>
        }
    </View>
}

export default AppendableList