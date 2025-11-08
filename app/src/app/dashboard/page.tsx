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

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Header />
        <AiProviderBanner />
        {/* Project grid */}
        <Grid container spacing={3}>
          {/* Project card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">
                    Community migration patterns
                  </Typography>
                  <Typography>Placeholder content</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          {/* Project card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">
                    Political discourse analysis 2024
                  </Typography>
                  <Typography>Placeholder content</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          {/* Project card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">
                    Mental health support analysis
                  </Typography>
                  <Typography>Placeholder content</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          {/* Project card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">
                    Sentiment analysis Q3 2024
                  </Typography>
                  <Typography>Placeholder content</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          {/* Project card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">Gaming community trends</Typography>
                  <Typography>Placeholder content</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          {/* New Project card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'transparent',
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
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
