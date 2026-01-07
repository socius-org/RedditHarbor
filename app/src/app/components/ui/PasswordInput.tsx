'use client';
import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#app/components/ui/input-group.tsx';

export function PasswordInput({
  defaultValue,
  ...rest
}: Omit<ComponentProps<'input'>, 'type'> & {
  defaultValue?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <InputGroup>
      <InputGroupInput
        key={defaultValue}
        defaultValue={defaultValue}
        type={isVisible ? 'text' : 'password'}
        {...rest}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          title={isVisible ? 'Hide' : 'Show'}
          onClick={() => {
            setIsVisible((prev) => !prev);
          }}
          // https://github.com/mui/material-ui/blob/6da6eb2/docs/data/material/components/text-fields/InputAdornments.tsx#L20-L26
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onMouseUp={(event) => {
            event.preventDefault();
          }}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
