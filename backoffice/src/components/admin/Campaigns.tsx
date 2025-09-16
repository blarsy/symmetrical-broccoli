import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { DataGrid } from "@mui/x-data-grid"
import { Stack } from "@mui/system"
import { Button } from "@mui/material"
import { useState } from "react"
import CreateCampaignDialog from "./CreateCampaignDialog"

const GET_CAMPAIGNS = gql`query GetCampaigns {
  getCampaigns {
    nodes {
      airdrop
      airdropAmount
      created
      defaultResourceCategories
      description
      beginning
      ending
      id
      name
      resourceRewardsMultiplier
    }
  }
}`

const Campaigns = () => {
    const { data, loading, error, refetch } = useQuery(GET_CAMPAIGNS)
    const [addingCampaign, setAddingCampaign] = useState(false)

    return <Stack alignContent="center">
        <Button variant="contained" onClick={() => setAddingCampaign(true)}>Add</Button>
        <LoadedZone loading={loading} error={error}>
            { data && <DataGrid  columns={[
                { field: 'id', headerName: 'Id'},
                { field: 'name', headerName: 'Name'},
                { field: 'description', headerName: 'Description'},
                { field: 'airdrop', headerName: 'Date airdrop'},
                { field: 'airdropAmount', headerName: 'Airdrop amount'},
                { field: 'beginning', headerName: 'Begin time'},
                { field: 'ending', headerName: 'End time'},
                { field: 'defaultResourcesCategories', headerName: 'Cat. par défaut'},
                { field: 'resourceRewardsMultiplier', headerName: 'Rewards multiplier'},
                { field: 'created', headerName: 'Date Création'}
            ]}
            rows={data.getCampaigns.nodes} /> } 
        </LoadedZone>
        <CreateCampaignDialog visible={addingCampaign} onClose={success => {
          setAddingCampaign(false)
          if(success) refetch()
        }} />
    </Stack>
}

export default Campaigns