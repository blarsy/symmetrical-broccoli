import { RouteProps } from "@/lib/utils"
import React, { useState } from "react"
import { Card, Text } from "react-native-paper"
import { imgUrl } from "@/lib/settings"
import { Resource } from "@/lib/schema"
import { t } from "@/i18n"
import { View } from "react-native"
import dayjs from "dayjs"

interface ResourceViewFieldProps {
    title: string,
    children: JSX.Element,
    titleOnOwnLine?: boolean
}

const ResourceViewField = ({ title, children, titleOnOwnLine }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, alignItems: titleOnOwnLine ?  'flex-start' : 'center', borderBottomColor: '#000', borderBottomWidth: 1
    }}>
    <Text variant="titleMedium">{title}</Text>
    {children}
</View>

const ViewResource = ({ route, navigation }:RouteProps) => {
    const resource = route.params.resource as Resource
    const [currentImgIdx, setCurrentImgIdx] = useState(0)
    const imgPath = resource.images.length === 0 ? '/placeholder.png': `${imgUrl}${resource.images[currentImgIdx].path}`
    let expirationText: string
    if(resource.expiration) {
        const dateObj = dayjs(resource.expiration)
        expirationText = `${dateObj.fromNow()} (${dateObj.format(t('dateTimeFormat'))})`
    } else {
        expirationText = ''
    }

    return <Card>
        <Card.Cover source={{ uri: imgPath }} />
        <Card.Content style={{ gap: 10 }}>
            <ResourceViewField title={t('title_label')}>
                <Text style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
            </ResourceViewField>
            <ResourceViewField title={t('description_label')} titleOnOwnLine>
                <Text>{resource.description}</Text>
            </ResourceViewField>
            { expirationText && <View>
                <ResourceViewField title={t('expiration_label')}>
                    <Text>{expirationText}</Text>
                </ResourceViewField>
            </View>}
            { resource.conditions && resource.conditions.length > 0 && <View>
                <ResourceViewField title={t('conditions_label')} titleOnOwnLine>
                    <View style={{ flexDirection: 'column' }}>
                        { resource.conditions.map(condition => <View style={{ paddingBottom: 5, borderTopWidth: 1, borderTopColor: '#aaa' }}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Text variant="bodySmall">{t('title_label')}</Text>
                                <Text>{condition.title}</Text>
                            </View>
                            <Text variant="bodySmall">{t('description_label')}</Text>
                            <Text>{condition.description}</Text>
                        </View>)}
                    </View>
                </ResourceViewField>
            </View> }
        </Card.Content>
    </Card>
}

export default ViewResource