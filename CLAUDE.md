# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `yarn dev` - Run the default development server
- `yarn dev:fast` - Run development server with rsbuild (faster)
- `yarn build` - Build the production viewer

### Testing
- `yarn test:unit` - Run unit tests
- `yarn test:unit:ci` - Run unit tests in CI mode
- `yarn test:e2e` - Run end-to-end tests
- `yarn test:e2e:debug` - Run end-to-end tests in debug mode

### Linting
- `prettier --write [file]` - Format code with Prettier

## Code Style Guidelines

### Imports
- Use named imports where possible
- Group imports: React, libraries, internal modules
- Use absolute imports with aliases (@ohif/*)

### UI Elements
- Use `@ohif/ui-next` components for UI elements, prefer components from `@ohif/ui-next` over deprecated`@ohif/ui`

### TypeScript
- Use TypeScript interfaces and types for props
- Type all function parameters and return values
- Use `withAppTypes<T>` for components that need app context

### Naming Conventions
- Components: PascalCase (MyComponent)
- Functions/variables: camelCase (myFunction)
- Files: Component files should match component name

### Error Handling
- Use try/catch blocks for async operations
- Log errors appropriately
- Use error boundaries for UI components

### Components
- Follow React functional component patterns
- Use hooks for state and side effects (useState, useEffect)
- Follow existing patterns for viewport components
