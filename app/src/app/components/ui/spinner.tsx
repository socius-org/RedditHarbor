import { Loader2Icon } from 'lucide-react';

import { cn } from '#app/utils/cn.ts';

type SpinnerProps = React.ComponentProps<'svg'> & {
  unsized?: boolean;
};

function Spinner({ className, unsized, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', !unsized && 'size-4', className)}
      {...props}
    />
  );
}

export { Spinner };
