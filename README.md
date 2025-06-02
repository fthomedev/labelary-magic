
# ZPL Easy - Online ZPL Converter

A powerful online tool for converting ZPL (Zebra Programming Language) files to PDF format. Built with React, TypeScript, and modern web technologies.

## Features

- 🚀 **Instant Conversion**: Cloud-based ZPL to PDF conversion
- 📁 **Multiple Formats**: Support for .txt, .zpl, and .zip files
- 🌍 **Internationalization**: Multi-language support (English, Portuguese)
- 📊 **Processing History**: Track your conversion history
- 🖨️ **Sheet Organization**: Organize labels on A4/A5 sheets for regular printers
- 🔒 **Secure**: Data protection and secure file handling

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Internationalization**: i18next + react-i18next
- **PDF Generation**: jsPDF
- **File Handling**: JSZip

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fthomedev/labelary-magic.git
cd labelary-magic
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

## Internationalization (i18n)

This project supports multiple languages using i18next. Currently supported languages:
- English (`en`)
- Portuguese Brazil (`pt-BR`)

### Adding New Translations

1. Add your translation keys to both `src/i18n/locales/en.ts` and `src/i18n/locales/pt-BR.ts`
2. Run the i18n validation script to check for missing keys:

```bash
npx tsx scripts/check-i18n.ts
```

### Language Detection

The application automatically detects user language based on:
1. Previously saved language preference (localStorage)
2. Browser language settings
3. Falls back to English if no match is found

### Translation Keys

Use the `useTranslation` hook to access translations:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('heroTitle')}</h1>;
}
```

### Validating Translations

Run the i18n check script to ensure all translation keys are properly defined:

```bash
npx tsx scripts/check-i18n.ts
```

This script will:
- Parse all TypeScript files for `t('key')` usage
- Compare used keys with available translations
- Report missing or unused keys
- Exit with code 1 if issues are found (useful for CI)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
│   ├── config.ts       # i18next configuration
│   └── locales/        # Translation files
├── integrations/       # Third-party integrations
├── lib/                # Utility libraries
├── pages/              # Page components
└── utils/              # Utility functions

scripts/
└── check-i18n.ts      # Translation validation script
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npx tsx scripts/check-i18n.ts` - Validate translations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the i18n validation script
5. Submit a pull request

## License

This project is licensed under the MIT License.
