import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
      </Stack>
    </Container>
  );
}
