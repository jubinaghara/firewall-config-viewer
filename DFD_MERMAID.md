# Data Flow Diagram (DFD) - Mermaid Format

This file contains DFD diagrams in Mermaid format that can be rendered in markdown viewers that support Mermaid (GitHub, GitLab, many documentation tools).

## Context Diagram (Level 0)

```mermaid
flowchart TD
    User[User]
    App[Sophos Firewall Config Viewer<br/>Browser/Electron Application]
    
    User -->|XML Files<br/>User Actions| App
    App -->|Reports<br/>HTML Exports<br/>Analysis Results| User
    
    style App fill:#e1f5ff,stroke:#005bc8,stroke-width:2px
    style User fill:#fff4e6,stroke:#ff9800,stroke-width:2px
```

## Level 1 DFD - Main Processes

```mermaid
flowchart TD
    User[User]
    
    subgraph App["Sophos Firewall Config Viewer"]
        P1[1.0 File Upload Handler]
        P2[2.0 XML Parser]
        P3[3.0 Report Generator]
        P4[4.0 Configuration Analyzer]
        P5[5.0 HTML Export Generator]
        P6[6.0 Diff Engine]
        P7[7.0 HTML Export Generator Diff]
        
        D1[("D1: Parsed Configuration Data<br/>(In-Memory State)")]
        D2[("D2: Analysis Results")]
        D3[("D3: Diff Results")]
    end
    
    User -->|XML File| P1
    P1 -->|XML Content| P2
    P2 -->|Parsed Data| D1
    D1 --> P3
    D1 --> P4
    P3 -->|Report View| P5
    P4 -->|Analysis Results| D2
    P5 -->|HTML File| User
    D2 -->|Analysis View| User
    
    User -->|Two XML Files| P1
    P1 -->|Old XML| P2
    P1 -->|New XML| P2
    P2 -->|Old Parsed| P6
    P2 -->|New Parsed| P6
    P6 -->|Diff Results| D3
    D3 -->|Diff View| P7
    P7 -->|HTML File| User
    
    style App fill:#e1f5ff,stroke:#005bc8,stroke-width:2px
    style D1 fill:#fff4e6,stroke:#ff9800,stroke-width:2px
    style D2 fill:#fff4e6,stroke:#ff9800,stroke-width:2px
    style D3 fill:#fff4e6,stroke:#ff9800,stroke-width:2px
    style User fill:#f0f0f0,stroke:#666,stroke-width:2px
```

## Level 2 DFD - XML Parser (Detailed)

```mermaid
flowchart TD
    Input[XML Content String]
    
    subgraph Parser["2.0 XML Parser"]
        P21[2.1 DOMParser<br/>Parse & Validate]
        P22[2.2 Entity Extractor<br/>Extract All Entities]
        P23[2.3 Data Structure Builder<br/>Build Structured Data]
    end
    
    Output[Parsed Configuration Data]
    
    Input --> P21
    P21 -->|XML Document| P22
    P22 -->|Entity Objects| P23
    P23 --> Output
    
    style Parser fill:#e1f5ff,stroke:#005bc8,stroke-width:2px
```

## Level 2 DFD - Report Generator (Detailed)

```mermaid
flowchart TD
    Input[Parsed Configuration Data]
    Settings[Section Visibility Settings]
    
    subgraph ReportGen["3.0 Report Generator"]
        P31[3.1 Data Filtering<br/>Filter by Sections]
        P32[3.2 Report View Builder<br/>Build Components]
        P33[3.3 UI Renderer<br/>Render React Components]
    end
    
    Output[Report View]
    
    Input --> P31
    Settings --> P31
    P31 -->|Filtered Data| P32
    P32 -->|Report Components| P33
    P33 --> Output
    
    style ReportGen fill:#e1f5ff,stroke:#005bc8,stroke-width:2px
```

## Level 2 DFD - Configuration Analyzer (Detailed)

```mermaid
flowchart TD
    Input[Parsed Configuration Data]
    
    subgraph Analyzer["4.0 Configuration Analyzer"]
        P41[4.1 Duplicate Detector<br/>Deep Comparison]
        P42[4.2 Analysis Results Builder<br/>Group & Statistics]
        P43[4.3 Analyzer UI Renderer<br/>Render Analysis View]
    end
    
    Output[Analysis View]
    
    Input --> P41
    P41 -->|Duplicate Groups| P42
    P42 -->|Analysis Results| P43
    P43 --> Output
    
    style Analyzer fill:#e1f5ff,stroke:#005bc8,stroke-width:2px
```

## Level 2 DFD - Diff Engine (Detailed)

```mermaid
flowchart TD
    OldXML[Old XML File]
    NewXML[New XML File]
    
    subgraph DiffEngine["6.0 Diff Engine"]
        P61[6.1 XML Parser<br/>Parse Both Files]
        P62[6.2 Entity Comparator<br/>Compare Entities]
        P63[6.3 Diff View Builder<br/>Build Diff View]
    end
    
    Output[Diff View]
    
    OldXML --> P61
    NewXML --> P61
    P61 -->|Old Entities| P62
    P61 -->|New Entities| P62
    P62 -->|Diff Results| P63
    P63 --> Output
    
    style DiffEngine fill:#e1f5ff,stroke:#005bc8,stroke-width:2px
```

## Complete System Flow

```mermaid
flowchart LR
    User[User]
    
    subgraph Upload["Upload Phase"]
        U1[File Selection]
        U2[File Reading]
    end
    
    subgraph Processing["Processing Phase"]
        P1[XML Parsing]
        P2[Data Structuring]
    end
    
    subgraph Analysis["Analysis Phase"]
        A1[Report Generation]
        A2[Duplicate Detection]
        A3[Diff Comparison]
    end
    
    subgraph Output["Output Phase"]
        O1[UI Display]
        O2[HTML Export]
    end
    
    User -->|Upload| Upload
    Upload --> Processing
    Processing --> Analysis
    Analysis --> Output
    Output -->|View/Download| User
    
    style Upload fill:#e3f2fd,stroke:#1976d2
    style Processing fill:#f3e5f5,stroke:#7b1fa2
    style Analysis fill:#e8f5e9,stroke:#388e3c
    style Output fill:#fff3e0,stroke:#f57c00
```

## Data Flow - Single File Report

```mermaid
sequenceDiagram
    participant U as User
    participant F as File Upload
    participant P as XML Parser
    participant D as Data Store
    participant R as Report Generator
    participant E as HTML Export
    participant V as View
    
    U->>F: Upload XML File
    F->>F: Read File Content
    F->>P: XML Content String
    P->>P: Parse XML
    P->>P: Extract Entities
    P->>D: Store Parsed Data
    D->>R: Retrieve Data
    R->>R: Filter by Sections
    R->>R: Build Report Components
    R->>V: Render Report View
    V->>U: Display Report
    U->>E: Request Export
    E->>D: Get Data
    E->>E: Generate HTML
    E->>U: Download HTML File
```

## Data Flow - Dual File Comparison

```mermaid
sequenceDiagram
    participant U as User
    participant F as Dual Upload
    participant P as XML Parser
    participant D1 as Old Data
    participant D2 as New Data
    participant C as Diff Engine
    participant V as Diff View
    participant E as HTML Export
    
    U->>F: Upload Old XML
    F->>P: Old XML Content
    P->>D1: Store Old Data
    
    U->>F: Upload New XML
    F->>P: New XML Content
    P->>D2: Store New Data
    
    D1->>C: Old Entities
    D2->>C: New Entities
    C->>C: Compare Entities
    C->>C: Identify Changes
    C->>V: Diff Results
    V->>U: Display Diff View
    
    U->>E: Request Export
    E->>C: Get Diff Results
    E->>E: Generate HTML
    E->>U: Download HTML File
```


