# Firewall Config Viewer

A beautiful, lightweight web application to parse and visualize firewall configuration files (Entities.xml) in a human-readable format.

## Features

- 📁 **Easy Upload**: Drag and drop or browse for Entities.xml files
- 📊 **Comprehensive Report View**: Beautiful, printable report format with table of contents
- 🔍 **Section Selection**: Choose which parts of the configuration to display
- 📄 **Export Options**: Export data as CSV, JSON, or Print/Save as PDF
- 🎨 **Modern UI**: Clean, professional design optimized for reports
- ⚡ **Fast & Lightweight**: Client-side parsing, works offline
- 📱 **Responsive**: Works on desktop and tablet devices
- 💻 **Desktop App**: Package as Windows `.exe` or macOS `.dmg` executable

## Packaging & Distribution

### 🚀 Create Executables (Recommended)

**For Windows:**
```bash
npm install
npm run electron:build:win
```
Output: `release/Firewall Config Viewer Setup x.x.x.exe`

**For macOS:**
```bash
npm install
npm run electron:build:mac
```
Output: `release/Firewall Config Viewer-x.x.x.dmg`

**Quick Start:** See `QUICK_START.md` for the fastest path to packaging.

**Full Guide:** See `PACKAGING.md` for detailed instructions and alternatives.

### 🌐 Run as Web App (Alternative)

1. Build static files:
```bash
npm run build
```

2. Run locally:
- **Windows**: Double-click `run-local.bat`
- **Mac/Linux**: Run `./run-local.sh` (may need `chmod +x run-local.sh`)

3. Open browser to `http://localhost:8000`

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Usage

1. **Upload Configuration**: Click the upload zone or drag and drop your `Entities.xml` file
2. **Explore Rules**: Browse through firewall rules in the table
3. **View Details**: Click on any rule row to expand and see full details
4. **Search**: Use the search bar to find specific rules
5. **Filter**: Filter by status (Enabled/Disabled) or policy type (Network/User)
6. **Export**: Click the Export button to download data as CSV or JSON

## Project Structure

```
firewall-config-viewer/
├── src/
│   ├── components/
│   │   ├── UploadZone.jsx      # File upload component
│   │   ├── RuleTable.jsx       # Main table view
│   │   ├── RuleDetails.jsx     # Expandable rule details
│   │   └── ExportButton.jsx    # Export functionality
│   ├── utils/
│   │   └── xmlParser.js        # XML parsing utilities
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## License

MIT
