import { ActivityIndicator, ScrollView, StatusBar, Text, View } from "react-native";
import React, { useEffect, useState } from 'react'
import {API_URL, TOKEN} from 'react-native-dotenv'


export default function Projects() {
    const [projects, setProjects] = useState({loading: true, data: [], error: ''} as {loading: boolean, data: any[], error: string})
    useEffect(() => {
      const load = async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/db/meta/projects/`, { headers: {
            'Xc-Token': TOKEN
          } })
          const jsonRes = await res.json()
          
          setProjects({loading: false, data: jsonRes.list, error: ''})
        } catch(e: any) {
          setProjects({loading: false, data: [], error: e.toString()})
        }
      }
      load()
    }, [])
    
    return <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar />

        <Text>Projects</Text>
        {
        projects.loading ? <ActivityIndicator/> :
        projects.error ? <Text style={{ color: 'red' }}>{projects.error}</Text> :
        <ScrollView>
            { projects.data.map(project => <Text key={project.id}>{project.title}</Text>) }
        </ScrollView>
        }
    </View>
}