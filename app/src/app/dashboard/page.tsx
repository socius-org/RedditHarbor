import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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

function AiProviderBanner() {
  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" variant="outlined">
          Configure now
        </Button>
      }
      variant="outlined"
    >
      No AI provider configured. Add API keys to enable document generation.
    </Alert>
  );
}

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Header />
        <AiProviderBanner />
      </Stack>
    </Container>
  );
}
