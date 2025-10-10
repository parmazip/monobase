# `@monobase/ui`

Shared UI component library for the Monobase Application Platform. Built with [shadcn/ui](https://ui.shadcn.com) for consistent, accessible components across all frontend applications.

## Architecture

This package follows a **domain-based organization pattern**:

- **Root directories** (`components/`, `hooks/`, `lib/`, `constants/`) contain **common/shared** code used across all domains
- **Domain subdirectories** (e.g., `person/`) are **self-contained** and can have their own `components/`, `hooks/`, `lib/`, `constants/`

```
packages/ui/src/
├── components/      # Common UI components (shadcn/ui)
├── hooks/           # Common React hooks
├── lib/             # Common utilities
├── constants/       # Common constants (countries, languages, timezones)
├── styles/          # Global CSS and theme
└── person/          # Person domain module
    ├── components/  # Person-specific forms
    └── schemas.ts   # Person validation schemas
```

## Installation

Add to your app's `package.json`:

```json
{
  "dependencies": {
    "@monobase/ui": "workspace:*"
  }
}
```

## Available Exports

### Styles
```typescript
import "@monobase/ui/styles"
```

### Common Components (shadcn/ui)
```typescript
import { Button } from "@monobase/ui/components/button"
import { Input } from "@monobase/ui/components/input"
import { Card } from "@monobase/ui/components/card"
import { Dialog } from "@monobase/ui/components/dialog"
// ... 40+ components available - see src/components/ for complete list
```

### Common Hooks
```typescript
import { useDetectCountry } from "@monobase/ui/hooks/use-detect-country"
import { useDetectLanguage } from "@monobase/ui/hooks/use-detect-language"
import { useDetectTimezone } from "@monobase/ui/hooks/use-detect-timezone"
import { useFormatCurrency } from "@monobase/ui/hooks/use-format-currency"
import { useFormatDate } from "@monobase/ui/hooks/use-format-date"
import { useMobile } from "@monobase/ui/hooks/use-mobile"
```

### Common Utilities
```typescript
import { cn } from "@monobase/ui/lib/utils"
import { detectCountry } from "@monobase/ui/lib/detect-country"
import { detectLanguage } from "@monobase/ui/lib/detect-language"
import { detectTimezone } from "@monobase/ui/lib/detect-timezone"
import { formatCurrency } from "@monobase/ui/lib/format-currency"
import { formatDate } from "@monobase/ui/lib/format-date"
```

### Common Constants
```typescript
import { COUNTRIES } from "@monobase/ui/constants/countries"
import { LANGUAGES } from "@monobase/ui/constants/languages"
import { TIMEZONES } from "@monobase/ui/constants/timezones"
```

### Domain: Person
```typescript
// Person-specific form components
import { PersonalInfoForm } from "@monobase/ui/person/components/personal-info-form"
import { ContactInfoForm } from "@monobase/ui/person/components/contact-info-form"
import { AddressForm } from "@monobase/ui/person/components/address-form"
import { PreferencesForm } from "@monobase/ui/person/components/preferences-form"

// Person validation schemas
import { personalInfoSchema, contactInfoSchema } from "@monobase/ui/person/schemas"
```

## Usage Example

```tsx
import "@monobase/ui/styles"
import { Button } from "@monobase/ui/components/button"
import { Input } from "@monobase/ui/components/input"
import { PersonalInfoForm } from "@monobase/ui/person/components/personal-info-form"
import { useDetectCountry } from "@monobase/ui/hooks/use-detect-country"
import { COUNTRIES } from "@monobase/ui/constants/countries"

export function MyComponent() {
  const country = useDetectCountry()

  return (
    <div>
      <Button>Click me</Button>
      <PersonalInfoForm onSubmit={handleSubmit} />
    </div>
  )
}
```

## shadcn/ui Configuration

This package uses shadcn/ui with the following setup (defined in `components.json`):

- **Style**: `new-york`
- **Base Color**: `zinc`
- **CSS Variables**: Enabled
- **Icon Library**: `lucide-react`

Components are managed via the shadcn CLI. See [CONTRIBUTING.md](./CONTRIBUTING.md) for development details.

## Development

For monorepo setup and general development workflow, see the [main README](../../README.md).

For UI package-specific development patterns, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Testing

```bash
# Run tests
bun test

# Watch mode
bun test:watch
```

## License

PROPRIETARY
