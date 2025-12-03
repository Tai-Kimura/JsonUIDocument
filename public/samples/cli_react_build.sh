# Build React components from JSON layouts
rjui build

# This generates:
# - React JSX components in src/generated/components/
# - StringManager.js with embedded translations
# - ColorManager.ts for color definitions
# - StyleManager.ts for style definitions

# Build process:
# 1. Parses all JSON files in Layouts directory
# 2. Converts JSON to React components using converters
# 3. Updates StringManager from Strings/*.json files
# 4. Generates TypeScript/JavaScript components
