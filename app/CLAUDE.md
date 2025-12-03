- Only create an abstraction if it's actually needed
- Prefer clear function/variable names over inline comments
- Avoid helper functions when a simple inline expression would suffice
- Prefer function declarations over arrow functions for named functions
- Prefer Sentence case

## React

- Avoid massive JSX blocks and compose smaller components
- Colocate code that changes together
- Avoid `useEffect` unless absolutely needed
- Use the `use` hook instead of `useContext` for reading context
- Use `useActionState` for form state management instead of `useState` + handlers
- Use `useOptimistic` for optimistic UI updates
- Use `useTransition` for non-blocking state updates
- Prefer `<form action={...}>` with Server Actions over `onSubmit` handlers
- Use `ref` as a prop directly (no need for `forwardRef`)
- Use `<Context>` as a provider instead of `<Context.Provider>`
- Don't manually memoise (using React Compiler)

## TypeScript

- Don't unnecessarily add `try`/`catch`
- Don't cast to `any`

## Workflow

- Always run `pnpm format` and `pnpm lint` after making changes
