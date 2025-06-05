$ErrorActionPreference = 'SilentlyContinue'

# Clean dist directory if it exists
if (Test-Path dist) {
    Remove-Item -Recurse -Force dist
}

# Create dist directory
New-Item -ItemType Directory -Force -Path dist

# Run TypeScript compiler
npx tsc
