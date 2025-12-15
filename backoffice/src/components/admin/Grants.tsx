import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { DataGrid } from "@mui/x-data-grid"
import { Stack } from "@mui/system"
import { Button } from "@mui/material"
import { useState } from "react"
import CreateGrantDialog from "./CreateGrantDialog"

const GET_GRANTS = gql`query GetGrants {
  getGrants {
    nodes {
      amount
      data
      created
      description
      expiration
      id
      title
    }
  }
}`

const Campaigns = () => {
    const { data, loading, error, refetch } = useQuery(GET_GRANTS)
    const [addingGrant, setAddingGrant] = useState(false)

    return <Stack alignContent="center">
        <Button variant="contained" 
            onClick={() => setAddingGrant(true)}
            >Add</Button>
        <LoadedZone loading={loading} error={error}>
            { data && <DataGrid  columns={[
                { field: 'id', headerName: 'Id'},
                { field: 'title', headerName: 'Title'},
                { field: 'description', headerName: 'Description'},
                { field: 'expiration', headerName: 'Expiration'},
                { field: 'amount', headerName: 'Amount granted'},
                { field: 'created', headerName: 'Creation'}
            ]}
            rows={data.getGrants.nodes} /> } 
        </LoadedZone>
        <CreateGrantDialog visible={addingGrant} onClose={success => {
          setAddingGrant(false)
          if(success) refetch()
        }} />
    </Stack>
}

export default Campaigns