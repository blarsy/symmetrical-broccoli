import { Account } from "@/schema"
import { Alert, Box, InputAdornment, TextField, Typography } from "@mui/material"
import { useState } from "react"
import LoadingList from "../LoadingList"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import axios from "axios"
import SearchIcon from '@mui/icons-material/Search'

interface Props {
    onSelect: (account: Account) => void
}

const SearchAccount = ({ onSelect }: Props) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [accountsState, setAccountsState] = useState(initial<Account[]>(false))
    return <Box display="flex" flexDirection="column">
        <TextField sx={{ alignSelf: 'stretch' }} name="searchTerm" size="small" 
            InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            onChange={async e => {
                setAccountsState(initial<Account[]>(true))
                setSearchTerm(e.target.value)
                try {
                    if(e.target.value.length >= 3) {
                        const res = await axios.get(`/api/account?search=${e.target.value}`, { headers: { Authorization: localStorage.getItem('token') }})
                        setAccountsState(fromData<Account[]>(res.data))
                    }
                } catch (e: any) {
                    setAccountsState(fromError(e, 'Erreur au chargement des données'))
                }
            }} value={searchTerm} />
        { searchTerm.length >= 3 ? 
            <LoadingList loadState={accountsState} onErrorClosed={() => setAccountsState(fromData([]))}
                displayItem={(account: Account) => `${account.name} (${account.email})`} onSelect={onSelect} /> :
            <Alert severity="info">Veuillez entrer au moins 3 caractères ci-dessus.</Alert>
        }
    </Box>
}

export default SearchAccount