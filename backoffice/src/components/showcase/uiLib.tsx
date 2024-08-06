import { fonts } from "@/theme";
import { Typography } from "@mui/material";

export const SectionTitle = ({ title, left }: { title: string, left?: boolean }) => <Typography textAlign="center" 
    color="#fff" lineHeight={44/48} fontFamily={fonts.title.style.fontFamily} 
    fontWeight={400}  fontSize={48} textTransform="uppercase" 
    sx={{ transform: left ? 'rotate(3.7deg)': 'rotate(-3.7deg)', paddingY: '2rem' }}>{title}
</Typography>