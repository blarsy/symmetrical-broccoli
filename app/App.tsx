import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native'
import React, {useEffect, useState} from 'react'
import {API_URL} from 'react-native-dotenv'

export default function App() {
  const [accounts, setAccounts] = useState({loading: true, data: [], error: ''} as {loading: boolean, data: any[], error: string})
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_URL)
        const jsonRes = await res.json()
        
        setAccounts({loading: false, data: jsonRes, error: ''})
      } catch(e: any) {
        setAccounts({loading: false, data: [], error: e.toString()})
      }
    }
    load()
  }, [])
  return (
    <View style={styles.container}>
      <Text>Account Id's</Text>
      {
        accounts.loading ? <ActivityIndicator/> :
        accounts.error ? <Text style={{ color: 'red' }}>{accounts.error}</Text> :
        <ScrollView>
          { accounts.data.map(account => <Text key={account.Id}>{account.Id}</Text>) }
        </ScrollView>
      }
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
