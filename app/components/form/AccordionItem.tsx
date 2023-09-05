import React from 'react'
import { useState, type PropsWithChildren } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Icons from '@expo/vector-icons/FontAwesome'

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
      borderBottomWidth: 1
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
            <Icons name={ expanded ? 'chevron-up' : 'chevron-down' }
                    size={20} color="#fff" />
            </TouchableOpacity>
            { expanded && body }
        </View>
    )
}

export default AccordionItem