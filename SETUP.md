# Setup Instructions

## Prerequisites

You need to have **Node.js** installed on your system to run this application.

### Installing Node.js (if not already installed)

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version for Windows
   - This will install both Node.js and npm (Node Package Manager)

2. **Install Node.js:**
   - Run the installer you downloaded
   - Follow the installation wizard (use default settings)
   - Restart your terminal/command prompt after installation

3. **Verify Installation:**
   Open a new terminal and run:
   ```powershell
   node --version
   npm --version
   ```
   Both commands should display version numbers.

## Running the Application

Once Node.js is installed, follow these steps:

### Step 1: Navigate to the project directory
```powershell
cd "C:\Users\jubin.aghara\OneDrive - Sophos Ltd\Work\AUTOMATION PYTHON\Examples\Humanreadable config\firewall-config-viewer"
```

### Step 2: Install dependencies
```powershell
npm install
```
This will download all required packages (React, Vite, Tailwind CSS, etc.)

### Step 3: Start the development server
```powershell
npm run dev
```

### Step 4: Open in browser
The terminal will display a URL (typically `http://localhost:5173`). Open this URL in your web browser.

## Alternative: Using a Package Manager

If you have **yarn** or **pnpm** installed instead of npm:

```powershell
# Using yarn
yarn install
yarn dev

# Using pnpm
pnpm install
pnpm dev
```

## Building for Production

To create a production build:

```powershell
npm run build
```

The built files will be in the `dist` folder, which can be deployed to any static hosting service.

## Troubleshooting

- **"node is not recognized"**: Node.js is not installed or not in PATH. Reinstall Node.js and restart your terminal.
- **Port already in use**: If port 5173 is busy, Vite will automatically use the next available port.
- **Installation errors**: Try deleting `node_modules` folder and `package-lock.json`, then run `npm install` again.
