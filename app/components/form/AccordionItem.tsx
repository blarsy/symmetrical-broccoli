import React from 'react'
import { useState, type PropsWithChildren } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { IconButton } from 'react-native-paper'
import Icon from 'react-native-paper/lib/typescript/components/Icon'

const styles = StyleSheet.create({
    container: {
      flex: 1
    },
    accordContainer: {
      paddingBottom: 4,
      margin: 4
    },
    accordHeader: {
      padding: 12,
      backgroundColor: 'transparent',
      color: '#fff',
      flex: 1,
      flexDirection: 'row',
      justifyContent:'space-between',
      borderBottomColor: '#fff',
      borderBottomWidth: 1,
      fontFamily: 'DK-magical-brush'
    },
    accordTitle: {
      fontSize: 20,
      color: '#fff'
    },
    accordBody: {
      padding: 4
    },
    textSmall: {
      fontSize: 16
    },
    seperator: {
      height: 12
    }
  })

type AccordionItemPros = PropsWithChildren<{
    title: string
  }>

function AccordionItem({ children, title }: AccordionItemPros): JSX.Element {
    const [ expanded, setExpanded ] = useState(false)
  
    function toggleItem() {
      setExpanded(!expanded)
    }

    const body = <View style={styles.accordBody}>{ children }</View>
  
    return (
        <View style={styles.accordContainer}>
            <TouchableOpacity style={styles.accordHeader} onPress={ toggleItem }>
              <Text style={styles.accordTitle}>{ title }</Text>
              {expanded && <Image source={require('/assets/FLECHE.svg')} style={{ width: 20, height: 20, tintColor: '#000', 
                transform: [{ rotate: '270deg' }] }}/>}
              {!expanded && <Image source={require('/assets/FLECHE.svg')} style={{ width: 20, height: 20, tintColor: '#fff', 
                transform: [{ rotate: '90deg' }] }}/>}
            </TouchableOpacity>
            { expanded && body }
        </View>
    )
}

export default AccordionItem