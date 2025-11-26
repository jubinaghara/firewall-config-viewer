# Data Flow Diagram (DFD) - Sophos Firewall Config Viewer

## Context Diagram (Level 0)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              Sophos Firewall Config Lens                     │
│                                                              │
│  ┌──────────────┐                                            │
│  │              │                                            │
│  │    User      │                                            │
│  │              │                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
│         │ XML Files                                          │
│         │ User Actions                                       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │         Application (Browser/Electron)               │    │
│  │                                                      │    │
│  │  • File Upload & Processing                          │    │
│  │  • XML Parsing                                       │    │
│  │  • Report Generation                                 │    │
│  │  • Configuration Analysis                            │    │
│  │  • Diff Comparison                                   │    │
│  │  • HTML Export                                       │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│         │                                                    │
│         │ Reports                                            │
│         │ HTML Exports                                       │
│         │ Analysis Results                                   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────┴───────┐                                            │
│  │              │                                            │
│  │    User      │                                            │
│  │              │                                            │
│  └──────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Level 1 DFD - Main Processes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                         SOPHOS FIREWALL CONFIG LENS                          │
│                                                                              │
│  ┌──────────────┐                                                            │
│  │              │                                                            │
│  │    User      │                                                            │
│  │              │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         │ XML File (Entities.xml)                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────┐                                                     │
│  │                     │                                                     │
│  │  1.0                │                                                     │
│  │  File Upload        │                                                     │
│  │  Handler            │                                                     │
│  │                     │                                                     │
│  └──────┬──────────────┘                                                     │
│         │                                                                    │
│         │ XML Content (String)                                               │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────┐                                                     │
│  │                     │                                                     │
│  │  2.0                │                                                     │
│  │  XML Parser         │                                                     │
│  │                     │                                                     │
│  └──────┬──────────────┘                                                     │
│         │                                                                    │
│         │ Parsed Data                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────┐                │
│  │                                                          │                │
│  │  D1: Parsed Configuration Data                           │                │ 
│  │  (In-Memory State)                                       │                │
│  │                                                          │                │
│  │  • Firewall Rules                                        │                │
│  │  • IP Hosts                                              │                │
│  │  • FQDN Hosts                                            │                │
│  │  • MAC Hosts                                             │                │
│  │  • Services                                              │                │
│  │  • Groups                                                │                │
│  │  • Entities by Tag                                       │                │ 
│  │                                                          │                │
│  └──────────────────────────────────────────────────────────┘                │
│         │                                                                    │
│         │                                                                    │
│         ├─────────────────────────────────────────────────────────────┐      │
│         │                                                             │      │
│         │                                                             │      │
│         ▼                                                             ▼      │
│  ┌─────────────────────┐                                    ┌────────────────┐
│  │                     │                                    │                │
│  │  3.0                │                                    │  4.0           │
│  │  Report             │                                    │  Configuration │
│  │  Generator          │                                    │  Analyzer      │
│  │                     │                                    │                │
│  └──────┬──────────────┘                                    └──────┬─────────┘
│         │                                                           │
│         │                                                           │
│         │                                                           │
│         ▼                                                           ▼
│  ┌─────────────────────┐                                    ┌────────────────┐
│  │                     │                                    │                │
│  │  5.0                │                                    │  D2:           │
│  │  HTML Export        │                                    │  Analysis      │
│  │  Generator          │                                    │  Results       │
│  │                     │                                    │                │
│  └──────┬──────────────┘                                    └────────────────┘
│         │                                                           │
│         │                                                           │
│         │                                                           │
│         ▼                                                           ▼
│  ┌──────┴───────┐                                          ┌──────┴───────┐
│  │              │                                          │              │
│  │    User      │                                          │    User      │
│  │              │                                          │              │
│  └──────────────┘                                          └──────────────┘
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Alternative Flow: Dual File Comparison                              │   │
│  │                                                                      │   │
│  │  User ──► 1.1 Dual Upload ──► 2.0 XML Parser (x2) ──►                │   │
│  │                                                                      │   │
│  │  ──► 6.0 Diff Engine ──► D3: Diff Results ──► 7.0 HTML Export ──►    │   │
│  │                                                                      │   │
│  │  User                                                                │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Level 2 DFD - Process Breakdown

### Process 2.0: XML Parser (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   2.0 XML Parser                           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  2.1 DOMParser                                       │  │
│  │  • Parse XML String                                  │  │
│  │  • Validate XML Structure                            │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                          │
│                 │ XML Document                             │
│                 │                                          │
│                 ▼                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  2.2 Entity Extractor                                │  │
│  │  • Extract FirewallRules                             │  │
│  │  • Extract IPHosts, FQDNHosts, MACHosts              │  │
│  │  • Extract Services, Groups                          │  │
│  │  • Extract All Entity Types                          │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                          │
│                 │ Entity Objects                           │
│                 │                                          │
│                 ▼                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  2.3 Data Structure Builder                          │  │
│  │  • Build Firewall Rules Array                        │  │
│  │  • Build Entities by Tag Map                         │  │
│  │  • Build Entity Maps                                 │  │
│  │  • Extract Metadata                                  │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                          │
│                 │ Structured Data Object                   │
│                 │                                          │
│                 ▼                                          │
│         Parsed Configuration Data                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Process 3.0: Report Generator (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                3.0 Report Generator                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  3.1 Data Filtering                                 │  │
│  │  • Filter by Section Visibility                     │  │
│  │  • Apply User Selections                            │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Filtered Data                              │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  3.2 Report View Builder                             │  │
│  │  • Build Executive Summary                           │  │
│  │  • Build Firewall Rules Table                       │  │
│  │  • Build Entity Tables                              │  │
│  │  • Build Detail Views                               │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Report Components                          │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  3.3 UI Renderer                                    │  │
│  │  • Render React Components                          │  │
│  │  • Apply Theme Styling                             │  │
│  │  • Handle User Interactions                         │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Rendered Report                            │
│                 │                                            │
│                 ▼                                            │
│              User Display                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Process 4.0: Configuration Analyzer (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│           4.0 Configuration Analyzer                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  4.1 Duplicate Detector                              │  │
│  │  • Deep Comparison of Entities                       │  │
│  │  • Group by Type Keys                               │  │
│  │  • Find Exact Duplicates                            │  │
│  │  • Find Partial Duplicates                          │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Duplicate Groups                           │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  4.2 Analysis Results Builder                        │  │
│  │  • Group Duplicates by Category                      │  │
│  │  • Calculate Statistics                              │  │
│  │  • Identify Common/Unique Members                    │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Analysis Results                           │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  4.3 Analyzer UI Renderer                           │  │
│  │  • Render Category List                             │  │
│  │  • Render Duplicate Groups                           │  │
│  │  • Highlight Common/Unique Items                     │  │
│  │  • Display Service Details Table                     │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Analyzer View                              │
│                 │                                            │
│                 ▼                                            │
│              User Display                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Process 6.0: Diff Engine (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                  6.0 Diff Engine                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  6.1 XML Parser (Old & New)                         │  │
│  │  • Parse Both XML Files                             │  │
│  │  • Extract Entities from Each                        │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Old Entities │ New Entities               │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  6.2 Entity Comparator                              │  │
│  │  • Compare by Signature                             │  │
│  │  • Identify Added Entities                           │  │
│  │  • Identify Removed Entities                        │  │
│  │  • Identify Modified Entities                       │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Diff Results                               │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  6.3 Diff View Builder                                │  │
│  │  • Build Side-by-Side View                          │  │
│  │  • Highlight Changes                                 │  │
│  │  • Group by Entity Type                              │  │
│  │                                                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│                 │ Diff View                                  │
│                 │                                            │
│                 ▼                                            │
│              User Display                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Dictionary

### External Entities
- **User**: The end-user interacting with the application

### Data Stores
- **D1: Parsed Configuration Data**: In-memory state containing structured configuration data
  - Firewall Rules
  - IP Hosts, FQDN Hosts, MAC Hosts
  - Services, Groups
  - Entities by Tag
  - Metadata (API Version, etc.)

- **D2: Analysis Results**: Results from duplicate detection and configuration analysis
  - Duplicate Groups
  - Partial Duplicate Groups
  - Statistics

- **D3: Diff Results**: Comparison results between two configuration files
  - Added Entities
  - Removed Entities
  - Modified Entities
  - Change Statistics

### Data Flows

#### Input Flows
- **XML File**: Raw XML configuration file (Entities.xml)
- **User Actions**: Click, drag-drop, selection, export requests
- **Section Visibility Settings**: User preferences for report sections

#### Output Flows
- **Reports**: Formatted configuration reports displayed in UI
- **HTML Exports**: Standalone HTML files containing reports
- **Analysis Results**: Duplicate detection and configuration analysis results
- **Diff Views**: Side-by-side comparison views
- **Error Messages**: Validation and parsing error messages

## Process Descriptions

### 1.0 File Upload Handler
- **Purpose**: Accept XML files from user via drag-drop or file selection
- **Input**: XML file (Entities.xml)
- **Output**: XML content as string
- **Processing**: Validates file type, reads file content, passes to parser

### 2.0 XML Parser
- **Purpose**: Parse XML string into structured JavaScript objects
- **Input**: XML content string
- **Output**: Parsed configuration data object
- **Processing**: Uses DOMParser, extracts entities, builds data structures

### 3.0 Report Generator
- **Purpose**: Generate formatted reports from parsed data
- **Input**: Parsed configuration data, section visibility settings
- **Output**: Rendered report view
- **Processing**: Filters data, builds report components, renders UI

### 4.0 Configuration Analyzer
- **Purpose**: Detect duplicates and misconfigurations
- **Input**: Parsed configuration data
- **Output**: Analysis results with duplicate groups
- **Processing**: Deep comparison, grouping, statistics calculation

### 5.0 HTML Export Generator
- **Purpose**: Generate standalone HTML files for reports
- **Input**: Parsed data, section visibility, report view
- **Output**: HTML file (downloadable)
- **Processing**: Converts React components to HTML, includes styles

### 6.0 Diff Engine
- **Purpose**: Compare two configuration files
- **Input**: Two XML files (old and new)
- **Output**: Diff results showing changes
- **Processing**: Parses both files, compares entities, identifies changes

### 7.0 HTML Export Generator (Diff)
- **Purpose**: Generate standalone HTML files for diff views
- **Input**: Diff results, old/new file names
- **Output**: HTML file with diff view (downloadable)
- **Processing**: Converts diff view to HTML format

## Security & Privacy Notes

- **100% Local Processing**: All data processing happens in the browser/Electron app
- **No External Communication**: No data is sent to external servers
- **No Persistent Storage**: Data is stored only in memory during session
- **Client-Side Only**: All parsing, analysis, and export happens locally

## Technology Stack

- **Frontend**: React 18.2.0
- **Build Tool**: Vite 5.4.21
- **Desktop**: Electron 28.3.3
- **Parsing**: DOMParser (native browser API)
- **Styling**: Tailwind CSS 3.3.6
- **Icons**: Lucide React (bundled), Material Symbols (local font)


