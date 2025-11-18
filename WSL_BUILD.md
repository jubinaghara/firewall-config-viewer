# Building Windows Executable from WSL

If you're building Windows executables from WSL (Windows Subsystem for Linux), you have two options:

## Option 1: Disable Code Signing (Recommended for Development)

Code signing requires Wine, which can be problematic in WSL. For development builds, disable signing:

```bash
npm run electron:build:win:nosign
```

Or set the environment variable:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build:win
```

## Option 2: Install Wine (For Signed Builds)

If you need signed executables, install Wine:

```bash
sudo apt update
sudo apt install wine64
```

Then run:
```bash
npm run electron:build:win
```

## Option 3: Build on Native Windows (Best for Production)

The most reliable way is to build Windows executables on a native Windows machine:

1. Open Command Prompt or PowerShell (not WSL)
2. Navigate to the project directory
3. Run:
   ```cmd
   npm install
   npm run electron:build:win
   ```

## Current Build Settings

The build is configured to:
- Skip code signing by default (`sign: null`)
- Only build x64 architecture (faster, most common)
- Create NSIS installer with custom installation options

## Troubleshooting

If you still get Wine errors:
1. Use the `nosign` script variant
2. Or build on native Windows
3. Or use the static web app approach (see `PACKAGING.md`)

