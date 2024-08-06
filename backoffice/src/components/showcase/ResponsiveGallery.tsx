import { urlFromPublicId } from "@/lib/images"
import { fonts } from "@/theme"
import { lightPrimaryColor } from "@/utils"
import { DocumentNode, useQuery } from "@apollo/client"
import { Card, CircularProgress, Stack, Theme, Typography, useMediaQuery } from "@mui/material"

interface ResponsiveGalleryProps {
    theme: Theme
    query: DocumentNode
    itemsFromData: (data: any) => { title: string, imagePublicId: string }[]
}

export default ({ theme, query, itemsFromData }: ResponsiveGalleryProps) => {
    const {data, loading, error} = useQuery(query)
    const smallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    const medScreen = useMediaQuery(theme.breakpoints.up('md'))
    const hugeScreen = useMediaQuery(theme.breakpoints.up('xl'))

    const fontSize = smallScreen ? '1rem' : (!medScreen ? '1.25rem' : '1.5rem')
    const flexBasis = smallScreen ? '47%' : (!medScreen ? '31%' : (hugeScreen ? '400px' : '23%'))

    if(loading) return <CircularProgress  />

    if(error) return <Typography variant="body2" color="error">Problème de chargement</Typography>
    
    const items = itemsFromData(data)

    if(items.length === 0) return <Typography variant="body2" color='error'>Problème de chargement</Typography>
    return <Stack style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: hugeScreen ? 'center': 'flex-start' }}>
        { items.map((item, idx) => <Card key={idx} elevation={5} 
            style={{ display:'flex', flexDirection: 'column', backgroundColor: lightPrimaryColor, 
                color: '#000', borderRadius: '1rem', padding: '1rem', gap: '1rem',  
                flexBasis, flexShrink: 1, flexGrow: 0, alignItems: 'center' }}>
            <Typography style={{ fontFamily: fonts.title.style.fontFamily, fontSize, fontWeight: 400, textAlign: 'center', flex: '1 1' }}>{item.title}</ Typography>
            <img style={{ borderRadius: '2.5rem', width: '100%' }} src={urlFromPublicId(item.imagePublicId)} alt={`Ìmage ${item.title}`}  />
        </Card>) }
    </Stack> 
}