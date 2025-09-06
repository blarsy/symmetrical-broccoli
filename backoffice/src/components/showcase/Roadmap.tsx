import { Box, Stack, Typography, useTheme } from "@mui/material"
import CheckEmpty from '@/app/img/roadmap/check-empty.svg'
import Check from '@/app/img/roadmap/check.svg'
import { fonts } from "@/theme"

interface StepStoneProps {
    leftText: string
    done?: boolean
    rightTextTitle: string
    rightTextDetail: string
}

const StepStone = (p: StepStoneProps) => {
    const theme = useTheme()
    return <Stack flexDirection="row">
        <Stack justifyContent="center" sx={{ flex: '0 0 30%' }}>
            <Typography color="#000" textAlign="right" fontFamily={fonts.sugar.style.fontFamily} sx={{
                fontSize: 22,
                fontWeight: 'bolder',
                [theme.breakpoints.down('lg')]: {
                    fontSize: 12
                },[theme.breakpoints.down('md')]: {
                    fontSize: 8
                }
            }}>{p.leftText}</Typography>
        </Stack>
        <Stack flex="0 0 20%" alignItems="center" justifyContent="center">
            <Box sx={{
                width: '4rem',
                [theme.breakpoints.down('lg')]: {
                    width: '3rem'
                },[theme.breakpoints.down('md')]: {
                    width: '2rem'
                }
            }}>
                { p.done ? <Check/>: <CheckEmpty/> }
            </Box>
        </Stack>
        <Stack flex="0 0 50%">
            <Typography color="#000" fontFamily={fonts.title.style.fontFamily}sx={{
                fontSize: 24,
                textTransform: 'uppercase',
                [theme.breakpoints.down('lg')]: {
                    fontSize: 18
                },[theme.breakpoints.down('md')]: {
                    fontSize: 12
                }
            }}>{p.rightTextTitle}</Typography>
            <Typography color="#000" fontFamily={fonts.sugar.style.fontFamily} lineHeight={1} sx={{
                fontSize: 22,
                fontWeight: 'bolder',
                [theme.breakpoints.down('lg')]: {
                    fontSize: 12
                },[theme.breakpoints.down('md')]: {
                    fontSize: 8
                }
            }}>{p.rightTextDetail}</Typography>
        </Stack>
    </Stack>
}

const Roadmap = () => {
    const theme = useTheme()

    return <Stack flexDirection="row" justifyContent="center" sx={{
        padding: '3rem',
        [theme.breakpoints.down('lg')]: {
            padding: '3rem 1rem',
        },[theme.breakpoints.down('md')]: {
            padding: '3 rem 0.5rem'
        }
    }}>
        <Stack sx={{ backgroundImage: `url('/sketchy-poster.svg')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundOrigin: "border-box",
            backgroundPosition: 'top',
            gap: '1rem',
            flex: '0 0 60%',
            padding: '2rem',
            [theme.breakpoints.down('lg')]: {
                flex: '0 0 80%',
            },[theme.breakpoints.down('md')]: {
                flex: '0 0 90%'
            }
         }}>
            <Typography color="#000" textAlign="center" textTransform="uppercase" variant="h1">Feuille de route</Typography>
            <StepStone leftText={'Avril 2024'} done rightTextTitle={'Version Alpha'} rightTextDetail={'Création de compte et de ressources. Messagerie instantanée.'}/>
            <StepStone leftText={'Août 2024'} done rightTextTitle={'Version Bèta'} rightTextDetail={'Customisation de compte. Notification de messages instantanés et nouvelles ressources.'}/>
            <StepStone leftText={'Décembre 2024'} done rightTextTitle={'Version stable'} rightTextDetail={'Une version jolie et complètement fonctionnelle, pour commencer les choses sérieuses.'}/>
            <StepStone leftText={'Juin 2025'} done rightTextTitle={'Mode "contributeur"'} rightTextDetail={`Pour les motivé.e.s, Tope-là devient un jeu gagnant-gagnant.`}/>
            <StepStone leftText={'2025'} rightTextTitle={'Collectivisation'} rightTextDetail={`Tope-là devient progressibement un projet 100% auto-géré par ses utilisateurs.`}/>
        </Stack>
    </Stack>
}

export default Roadmap