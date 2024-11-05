import React, { useContext, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Image, ImageSourcePropType, TouchableOpacity, View } from "react-native"
import ChatBackground from "./ChatBackground"
import { IconButton, Text, TextInput } from "react-native-paper"
import Images from "@/Images"
import { t } from "@/i18n"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { adaptToWidth, pickImage } from "@/lib/utils"
import { imgSourceFromPublicId, uploadImage } from "@/lib/images"
import { AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { ScrollView } from "react-native-gesture-handler"
import BareIconButton from "../layout/BareIconButton"
import DataLoadState from "@/lib/DataLoadState"
import dayjs from "dayjs"
import PanZoomImage from "../PanZoomImage"
import { MESSAGES_PER_PAGE } from "./ConversationContextProvider"
import LoadedZone from "../LoadedZone"

const chatImageSize = adaptToWidth(130, 250, 400)

interface BottomBarProps {
    onSend: (text: string, imagePublicId: string) => Promise<void>
    disabled?: boolean
    testID: string
}

const BottomBar = ({ onSend, disabled, testID }: BottomBarProps) => {
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const appDispatch = useContext(AppDispatchContext)
    return <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, 
            borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}>
        <BareIconButton testID={`${testID}:SendPicture`} size={50} Image={Images.Photos} disabled={disabled} 
            color={!disabled ? primaryColor : '#777'} 
            onPress={() => pickImage(async img => {
                setSending(true)
                try {
                    const uploadRes = await uploadImage(img.uri)
                    onSend(message, uploadRes)
                } catch (e) {
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                } finally {
                    setSending(false)
                }
            }, 400)} />
        <TextInput mode="outlined" outlineStyle={{ borderWidth: 0, backgroundColor: 'transparent' }}
            testID={`${testID}:Message`} style={{ flex: 1 }} 
            contentStyle={{ textAlignVertical: 'center' }}
            placeholder={!disabled ? t('type_message_here') : t('cannot_send_to_deleted_account')}  placeholderTextColor="#aaa"
            value={message} onChangeText={setMessage} multiline/>
        {sending && <ActivityIndicator color={primaryColor}/>}
        <BareIconButton testID={`${testID}:SendButton`} Image={Images.Send} 
            disabled={disabled}
            size={35}
            color={!disabled ? primaryColor : '#777'} onPress={async () => {
                if(message) {
                    setSending(true)
                    try {
                        await onSend(message, '')
                        setMessage('')
                    } catch (e) {
                        appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                    } finally {
                        setSending(false)
                    }
                }
            }}/>
    </View>
}

export interface IMessage {
    id: number
    text: string
    createdAt: Date
    user: {
        id: number
        name: string
        avatar: string
    }
    image?: string
    sent?: boolean
    received?: boolean
}

interface Props {
    onSend: (text: string, imagePublicId: string) => Promise<void>
    testID: string
    messages: DataLoadState<IMessage[]>
    otherAccount: { id: number, name: string }
    onLoadEarlier: () => void
    canLoadEarlier? : boolean
    loadingEarlier: boolean
}

const Chat = ({ onSend, testID, messages, otherAccount, onLoadEarlier, canLoadEarlier, loadingEarlier }: Props) => {
    const [focusedImage, setFocusedImage] = useState<ImageSourcePropType | undefined>(undefined)
    const scrollRef = useRef<ScrollView | null>(null)
    const [scrolledToBottom, setScrolledToBottom] = useState(false)
    const [scrollsToTail, setScrollsToTail] = useState(true)
    const [invertedMessages, setInvertedMessages] =useState<IMessage[]>([])
    
    useEffect(() => {
        if(messages.data && messages.data.length > 0) {
            setInvertedMessages(messages.data!.slice().reverse())
            
            if(!scrolledToBottom){
                setTimeout(() => {
                    scrollRef.current?.scrollToEnd()
                    setScrolledToBottom(true)
                }, 0)
            }
            console.log('scrollsToTail checked', scrollsToTail)
            if(scrollsToTail) {
                setTimeout(() => {
                    scrollRef.current?.scrollToEnd()
                }, 0)
            }
        }
    }, [messages])

    return <ChatBackground>
        <LoadedZone containerStyle={{ flex: 1 }} loading={messages.loading} error={messages.error}>
            <ScrollView maintainVisibleContentPosition={{ minIndexForVisible: MESSAGES_PER_PAGE }} 
                ref={scrollRef} scrollEventThrottle={100}
                onScroll={e => {
                    if(e.nativeEvent.contentOffset.y === 0) {
                        onLoadEarlier()
                    }
                    setScrollsToTail(e.nativeEvent.contentOffset.y + e.nativeEvent.layoutMeasurement.height > e.nativeEvent.contentSize.height - 20)
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        { canLoadEarlier && !loadingEarlier && <IconButton size={20} icon="arrow-up" iconColor={primaryColor} onPress={onLoadEarlier}/>}
                        { loadingEarlier && <ActivityIndicator size={30} color={primaryColor}/> }
                    </View>
                    { invertedMessages.map((msg, index, arr) => {
                        const fromOther = msg.user.id != otherAccount.id
                        let dateToDisplay: string = ''
                        
                        if(index === 0 || (dayjs(msg.createdAt).format('DDMMYYYY') != dayjs(invertedMessages[index - 1].createdAt).format('DDMMYYYY'))) {
                            dateToDisplay = dayjs(msg.createdAt).format('ddd DD MMM, YY')
                        }
                        return <View key={index} style={{ flex: 1, alignItems: fromOther ? 'flex-start': 'flex-end', gap: 5 }}>
                            { dateToDisplay && 
                            <Text variant="bodySmall" style={{ alignSelf: 'center', color: primaryColor, fontWeight: 'bold' }}>
                                {dateToDisplay}
                            </Text> }
                            <View style={{ flexDirection: 'column', backgroundColor: fromOther ? lightPrimaryColor : primaryColor, padding: 15,
                                borderRadius: 15, margin: 5, alignItems: fromOther ? 'flex-start': 'flex-end'
                            }}>
                            { msg.image && <TouchableOpacity onPress={() => setFocusedImage(imgSourceFromPublicId(msg.image!))}>
                                <Image style={{ width: chatImageSize, height: chatImageSize, borderRadius: 10 }} source={imgSourceFromPublicId(msg.image)} />
                            </TouchableOpacity> }
                            <Text variant="displayMedium" testID={`${testID}:Messages:${index}`}>{msg.text}</Text>
                            <Text variant="bodySmall" style={{ marginTop: 5, color: fromOther ? '#aaa' : '#fff' }}>{dayjs(msg.createdAt).format('HH:mm')}</Text>
                            </View>
                        </View>}) }
            </ScrollView>
            <BottomBar testID={testID} onSend={async (text, img) => {
                await onSend(text, img)
                scrollRef.current?.scrollToEnd()
            }} disabled={!otherAccount.name || !!messages.loading} />
        </LoadedZone>
        <PanZoomImage source={focusedImage} onDismess={() => setFocusedImage(undefined)} />
    </ChatBackground>
}

export default Chat