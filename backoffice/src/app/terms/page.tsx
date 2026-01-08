"use client"
import Themed from "@/components/scaffold/Themed"
import { Box, Container, Divider, Typography } from "@mui/material"
import { PropsWithChildren, Suspense } from "react"

const Paragraph = (p : PropsWithChildren) => <Typography variant="body1" sx={{ paddingBottom: '0.5rem' }}>{p.children}</Typography>
const CustomDivider = () => <Divider sx={{ margin: '0.5rem', borderBottomWidth: 'medium' }} />
const BulletList = ({texts, listStyleType} : { texts: string[], listStyleType?: string }) => <ul style={{ marginLeft: '4rem', listStyleType }}>
    { texts.map((t, idx) => <li key={idx} style={{ paddingLeft: '0.5rem' }}><Paragraph>{t}</Paragraph></li>) }
</ul>

const Terms = () => {
    return <Themed>
        <Container maxWidth="md" sx={{ height: '100vh'}}>
            <Box display="flex" flexDirection="column" flex="1" justifyContent="flex-start">
                <Typography textAlign="center" variant="h1">Conditions Générales d’Utilisation</Typography>
                <Typography variant="h2">1. Objet de la plateforme</Typography>
                <Typography variant="body1">Tope‑là est une plateforme d’échange destinée à faciliter des échanges non monétaires, solidaires et expérimentaux entre utilisateurs, au moyen d’une unité de compte interne appelée Tope.</Typography>
                <Typography variant="body1">La plateforme vise prioritairement des échanges occasionnels, non professionnels ou faiblement professionnalisés, ainsi que des formes de contribution difficilement ou imparfaitement prises en charge par l’économie monétaire classique.</Typography>
                <Typography variant="h2">2. Nature du Tope</Typography>
                <Typography variant="body1">Le Tope est une unité de compte interne à la plateforme Tope‑là.</Typography>
                <Typography variant="body1">Il ne constitue pas :</Typography>
                <BulletList texts={[
                    'une monnaie au sens légal du terme,',
                    'une monnaie électronique,',
                    'un moyen de paiement officiel,',
                    'un instrument financier,',
                    'un bon d\’achat convertible,',
                    'ni un titre donnant droit à une contrepartie monétaire.',
                ]} />
                <Typography variant="body1">Le Tope :</Typography>
                <BulletList texts={[
                    'n\’est pas échangeable contre de l\’euro,',
                    'n\’est ni acheté ni vendu contre de la monnaie officielle,',
                    'n\’est pas adossé à une monnaie, à une durée de travail, ni à un étalon stable,',
                    'n\’ouvre droit à aucune conversion, remboursement ou garantie de valeur.',
                ]} />
                <Typography variant="body1">Sa valeur est strictement conventionnelle, subjective et contextuelle, résultant uniquement de l’accord libre entre les utilisateurs lors d’un échange.</Typography>
                <Typography variant="h2">3. Échanges entre utilisateurs</Typography>
                <Typography variant="body1">Les échanges réalisés via la plateforme reposent sur :</Typography>
                <BulletList texts={[
                        'la négociation libre entre les parties,',
                        'l\’absence de barème officiel,',
                        'l\’absence de prix de référence imposé,',
                        'l\’absence de garantie de valeur économique.'
                ]} />
                <Typography variant="body1">Les utilisateurs reconnaissent que :</Typography>
                <BulletList texts={[
                    'les échanges peuvent ne pas correspondre à une équivalence monétaire,',
                    'les Topes reçus peuvent ne jamais être réutilisés,',
                    'la plateforme n’intervient pas dans l’évaluation des échanges.',
                ]} />
                <Typography variant="body1">Chaque utilisateur demeure seul responsable de ses obligations légales, fiscales ou sociales éventuelles, notamment en cas d’usage professionnel ou assimilable.</Typography>
                <Typography variant="h2">4. Mécanisme de dotation de la plateforme (10 %)</Typography>
                <Typography variant="body1">Afin d’assurer le fonctionnement, la maintenance et le développement de Tope‑là, un mécanisme de dotation est appliqué à chaque échange.</Typography>
                <Typography variant="body1">À chaque échange validé entre deux utilisateurs :</Typography>
                <BulletList texts={[
                        'le montant négocié est transféré entre les comptes concernés,',
                        'un montant équivalent à 10 % du volume de l\’échange est simultanément créé et attribué à un compte spécifique géré par l\’équipe de Tope‑là.',
                ]} />
                <Typography variant="body1">Cette dotation :</Typography>
                <BulletList texts={[
                        'ne constitue pas une commission monétaire,',
                        'ne donne lieu à aucun prélèvement en euros,',
                        'est exprimée exclusivement en Topes.',
                ]} />
                <Typography variant="h2">5. Usage des Topes de dotation</Typography>
                <Typography variant="body1">Les Topes détenus par l’équipe de Tope‑là peuvent être utilisés exclusivement pour :</Typography>
                <Typography variant="h3">5.1. Frais de fonctionnement</Typography>
                <BulletList texts={[
                        'biens matériels nécessaires au projet (mobilier, informatique, équipement),',
                        'services nécessaires au fonctionnement (hébergement, juridique, audit, tests, communication),',
                        'autres dépenses opérationnelles liées à la plateforme.',
                ]} />
                <Typography variant="h3">5.2. Développement et prestations</Typography>
                <Typography variant="body1">Le recours à des prestataires externes, y compris des membres de l’équipe disposant d’un statut juridique approprié (indépendant, coopérative type SMART, etc.), est possible sous réserve que :</Typography>
                <BulletList texts={[
                        'les missions soient ponctuelles et précisément définies,',
                        'les prestations soient facturées en euros,',
                        'les obligations fiscales et sociales soient intégralement respectées,',
                        'les Topes ne constituent ni la base de la facturation, ni un équivalent de rémunération.',
                ]} />
                <Typography variant="h3">5.3. Conversion indirecte pour frais incompressibles</Typography>
                <Typography variant="body1">Lorsque certains frais ne peuvent raisonnablement être réglés en Topes, l’équipe peut :</Typography>
                <BulletList texts={[
                        'acquérir des biens ou services via la plateforme en Topes,',
                        'revendre ces biens ou services en euros,',
                        'affecter les euros ainsi obtenus exclusivement au paiement de frais de fonctionnement ou de développement dûment justifiés.',
                ]} />
                <Typography variant="body1">Un registre interne est tenu, comprenant :</Typography>
                <BulletList texts={[
                        'l\’inventaire des biens acquis via la plateforme,',
                        'l\’inventaire des reventes en euros,',
                        'les justificatifs des dépenses financées.',
                ]} />
                <Typography variant="h2">6. Absence de rémunération automatique</Typography>
                <Typography variant="body1">Les mécanismes décrits ci‑dessus ne constituent en aucun cas :</Typography>
                <BulletList texts={[
                        'une rémunération,',
                        'un salaire,',
                        'un revenu garanti,',
                        'un droit acquis pour les membres de l\’équipe.',
                ]} />
                <Typography variant="body1">Toute attribution de Topes à des membres de l’équipe à titre de reconnaissance contributive reste :</Typography>
                <BulletList texts={[
                        'non automatique,',
                        'non exigible,',
                        'non contractuelle,',
                        'non convertible.',
                ]} />
                <Typography variant="h2">7. Transparence</Typography>
                <Typography variant="body1">Tope‑là s’engage à fournir aux utilisateurs une information claire sur :</Typography>
                <BulletList texts={[
                        'les principes d\’usage du Tope,',
                        'le mécanisme de dotation,',
                        'les grandes catégories d\’utilisation des Topes par la plateforme.',
                ]} />
                <Typography variant="body1">Cette transparence vise à garantir la confiance, sans pour autant constituer une obligation de résultat ou de redistribution.</Typography>
                <Typography variant="h2">8. Évolution du système</Typography>
                <Typography variant="body1">Les utilisateurs reconnaissent que Tope‑là est un projet expérimental. Les règles d’usage du Tope peuvent évoluer afin de :</Typography>
                <BulletList texts={[
                        'préserver la conformité légale du projet,',
                        'répondre à l’évolution des usages,',
                        'éviter toute requalification juridique non souhaitée.',
                ]} />
                <Typography variant="body1">Toute modification substantielle fera l’objet d’une information préalable.</Typography>
            </Box>
        </Container>
    </Themed>
}

export default () => <Suspense>
    <Terms />
</Suspense>