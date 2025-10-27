'use client';
import MuiLink, { type LinkProps } from '@mui/material/Link';
import NextLink from 'next/link';

export function Link(props: LinkProps) {
  return <MuiLink component={NextLink} {...props} />;
}
