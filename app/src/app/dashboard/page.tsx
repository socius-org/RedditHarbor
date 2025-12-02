import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { AiProviderBanner } from './AiProviderBanner';

const PROJECTS = [
  {
    id: '1',
    title: 'Community migration patterns',
    description: 'Placeholder content',
  },
  {
    id: '2',
    title: 'Political discourse analysis 2024',
    description: 'Placeholder content',
  },
  {
    id: '3',
    title: 'Mental health support analysis',
    description: 'Placeholder content',
  },
  {
    id: '4',
    title: 'Sentiment analysis Q3 2024',
    description:
      'This project analyzes sentiment trends across multiple subreddits over Q3 2024, tracking emotional patterns and community reactions to major events. Includes data from r/news, r/politics, and r/worldnews.',
  },
  {
    id: '5',
    title: 'Gaming community trends',
    description: 'Placeholder content',
  },
];

function Header() {
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back
      </Typography>
      <Typography variant="body1">
        Continue your GDPR-compliant Reddit research or start a new project
      </Typography>
    </div>
  );
}

function ProjectCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          <Typography>{description}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function NewProjectCard() {
  return (
    <Card
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <CardActionArea sx={{ height: '100%' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            height: '100%',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <AddIcon fontSize="large" />
          </Box>
          <Typography variant="h6">New project</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Header />
        <AiProviderBanner />
        <Grid container spacing={3}>
          {PROJECTS.map((project) => (
            <Grid key={project.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ProjectCard
                title={project.title}
                description={project.description}
              />
            </Grid>
          ))}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <NewProjectCard />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
