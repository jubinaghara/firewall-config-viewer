# SBOM (Software Bill of Materials) Generation Guide

This guide explains how to generate SBOM files in standard formats for upload to Black Duck or other security scanning tools.

## What is an SBOM?

A Software Bill of Materials (SBOM) is a comprehensive inventory of all components, libraries, and dependencies used in your application. It's essential for:
- Security vulnerability scanning (Black Duck, Snyk, etc.)
- License compliance
- Supply chain security
- Regulatory compliance

## Supported Formats

This project supports generating SBOMs in:
- **CycloneDX JSON** (Recommended for Black Duck) - Modern, comprehensive format
- **SPDX JSON** - Industry standard format

Both formats are supported by Black Duck and most security tools.

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install `@cyclonedx/cyclonedx-npm` which is used for SBOM generation.

2. **Ensure package-lock.json exists:**
   ```bash
   npm install
   ```
   The SBOM generator uses `package-lock.json` to get accurate dependency information.

## Generating SBOM Files

### Quick Start (CycloneDX - Recommended for Black Duck)

Generate a CycloneDX JSON SBOM:

```bash
npm run sbom:cyclonedx
```

**Output:** `sbom-cyclonedx.json`

This is the recommended format for Black Duck uploads.

### Generate SPDX Format

Generate an SPDX JSON SBOM:

```bash
npm run sbom:spdx
```

**Output:** `sbom-spdx.json`

### Generate Both Formats

Generate both CycloneDX and SPDX formats at once:

```bash
npm run sbom:all
```

**Output:**
- `sbom-cyclonedx.json`
- `sbom-spdx.json`

### Default SBOM (CycloneDX)

The default `sbom` command generates CycloneDX format:

```bash
npm run sbom
```

**Output:** `sbom.json` (CycloneDX format)

## Uploading to Black Duck

### Method 1: Direct Upload via Web UI

1. **Generate the SBOM:**
   ```bash
   npm run sbom:cyclonedx
   ```

2. **Log in to Black Duck:**
   - Navigate to your Black Duck instance
   - Go to your project

3. **Upload the SBOM:**
   - Navigate to "Components" or "Scans" section
   - Click "Upload" or "Import"
   - Select `sbom-cyclonedx.json`
   - Choose format: **CycloneDX JSON**
   - Upload the file

### Method 2: Using Black Duck API

If you have API access:

```bash
# Example using curl (adjust URL and credentials)
curl -X POST \
  https://your-blackduck-instance/api/scan/data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -F "file=@sbom-cyclonedx.json"
```

### Method 3: Using Black Duck CLI

If you have the Black Duck CLI installed:

```bash
# Generate SBOM first
npm run sbom:cyclonedx

# Upload using Black Duck CLI
bd-cli upload-sbom --file sbom-cyclonedx.json --project "Your Project Name"
```

## SBOM File Locations

All SBOM files are generated in the project root directory:

```
firewall-config-viewer/
├── sbom-cyclonedx.json    (CycloneDX format - recommended)
├── sbom-spdx.json         (SPDX format)
└── sbom.json              (CycloneDX format - default)
```

## What's Included in the SBOM

The generated SBOM includes:

- ✅ **All dependencies** (from `package.json`)
- ✅ **All transitive dependencies** (dependencies of dependencies)
- ✅ **Version information** (exact versions from `package-lock.json`)
- ✅ **License information** (when available)
- ✅ **Package metadata** (name, description, author)
- ✅ **Component hashes** (for verification)

## Updating SBOM After Dependency Changes

Whenever you add, update, or remove dependencies:

1. **Update package-lock.json:**
   ```bash
   npm install
   ```

2. **Regenerate SBOM:**
   ```bash
   npm run sbom:cyclonedx
   ```

3. **Upload the new SBOM to Black Duck**

## Integration with CI/CD

### GitHub Actions Example

Add this to your `.github/workflows/sbom.yml`:

```yaml
name: Generate SBOM

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  generate-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate SBOM
        run: npm run sbom:cyclonedx
      
      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v3
        with:
          name: sbom-cyclonedx
          path: sbom-cyclonedx.json
      
      - name: Upload to Black Duck (optional)
        run: |
          # Add your Black Duck upload command here
          # curl -X POST ... or bd-cli upload-sbom ...
```

### GitLab CI Example

Add this to your `.gitlab-ci.yml`:

```yaml
generate-sbom:
  image: node:18
  script:
    - npm ci
    - npm run sbom:cyclonedx
  artifacts:
    paths:
      - sbom-cyclonedx.json
    expire_in: 30 days
```

## Troubleshooting

### Error: "Cannot find module '@cyclonedx/cyclonedx-npm'"

**Solution:** Install dependencies:
```bash
npm install
```

### Error: "package-lock.json not found"

**Solution:** Generate package-lock.json:
```bash
npm install
```

### SBOM is missing some dependencies

**Solution:** 
1. Ensure `package-lock.json` is up to date:
   ```bash
   npm install
   ```
2. Regenerate SBOM:
   ```bash
   npm run sbom:cyclonedx
   ```

### Black Duck rejects the SBOM file

**Possible causes:**
1. **Wrong format:** Make sure you're using CycloneDX JSON format
2. **Invalid JSON:** Validate the JSON file:
   ```bash
   # Check if JSON is valid
   node -e "JSON.parse(require('fs').readFileSync('sbom-cyclonedx.json'))"
   ```
3. **Missing required fields:** Ensure all dependencies are installed and `package-lock.json` exists

**Solution:** 
- Use CycloneDX format: `npm run sbom:cyclonedx`
- Verify the file is valid JSON
- Check Black Duck documentation for format requirements

## Advanced Configuration

### Custom SBOM Output Location

To change the output location, modify the scripts in `package.json`:

```json
{
  "scripts": {
    "sbom:cyclonedx": "cyclonedx-npm --output-file ./reports/sbom-cyclonedx.json"
  }
}
```

### Include Dev Dependencies

By default, dev dependencies are included. To exclude them, you would need to modify the cyclonedx-npm configuration, but for security scanning, it's recommended to include all dependencies.

### Generate SBOM for Production Build

To generate SBOM after building:

```bash
npm run build
npm run electron:build:win:installer
npm run sbom:cyclonedx
```

This ensures the SBOM reflects the exact dependencies used in the production build.

## Best Practices

1. **Generate SBOM regularly:**
   - After every dependency update
   - Before each release
   - As part of CI/CD pipeline

2. **Version control:**
   - Consider committing SBOM files to version control
   - Or store them as build artifacts

3. **Automate:**
   - Include SBOM generation in your CI/CD pipeline
   - Automatically upload to Black Duck after generation

4. **Verify:**
   - Validate SBOM files before uploading
   - Check that all expected dependencies are included

5. **Document:**
   - Keep track of SBOM generation dates
   - Document any manual dependency additions

## Additional Resources

- [CycloneDX Specification](https://cyclonedx.org/specification/overview/)
- [SPDX Specification](https://spdx.dev/specifications/)
- [Black Duck Documentation](https://community.synopsys.com/s/article/Black-Duck-Documentation)
- [OWASP SBOM Guide](https://owasp.org/www-project-software-bill-of-materials/)

## Summary

**Quick command for Black Duck:**
```bash
npm run sbom:cyclonedx
```

This generates `sbom-cyclonedx.json` which you can upload directly to Black Duck.


