# AquaWatch: Smart Water Conservation System

> **“Save Water Today. Secure Tomorrow.”**  
> *AquaWatch — Every Drop Counts.*

AquaWatch is a modern, data-driven web dashboard designed to monitor, analyze, and reduce water wastage at schools, campuses, and households. It combines real-time flow monitoring, crowd-sourced water waste reporting, student habit analytics, rule-based conservation recommendations, and a transparent water conservation score.

---

## 🌊 Key Features

1. **Environmental KPI Overview**
   - **Total Water Consumption**: Live daily volumetric usage across all facility sub-meters.
   - **Water Saved**: Verifiable litres conserved compared to the documented pre-intervention baseline.
   - **Leaking Taps Detected**: Real-time counter of active leaks versus verified and resolved incidents.
   - **Water Conservation Score (0–100)**: Transparent weighted index based on reduction, leak resolution rate, scheduled inspections, and habit survey completion.

2. **Consumption Analytics & Visualizations**
   - **Daily Water Consumption Trend**: Interactive Recharts timeline over 7 or 30 days with hover tooltips.
   - **Before-and-After Comparison**: Baseline benchmark vs. current period with percentage reduction and data availability guards.
   - **Usage by Location**: Detailed breakdown across washrooms, cafeteria, irrigation, drinking stations, and laboratories.

3. **Water Waste Detection & Incident Tracking**
   - Track leaking taps, taps left running, excessive garden watering, and basin overflows.
   - Interactive **Report Water Waste** modal with incident classification, estimated loss calculation, and inspection verification workflow.

4. **Student Water Habits & Survey Analytics**
   - Visual comparison of student conservation habits (tap running, shower duration, water reuse).
   - Clear distinction between **Illustrative Demonstration Data** and **Actual Survey Submissions**.
   - Live survey input form that dynamically recalculates percentages using valid response counts.

5. **Rule-Based Conservation Recommendations**
   - Automated priority recommendations triggered by real database events (e.g. active leaks, washroom consumption surges, uncalibrated baselines).
   - Interactive status updates (`Pending` ↔ `Completed`).

6. **Facility Inspection Records**
   - Maintenance log for plumbing checks, leak counts found/resolved, and technician notes.

---

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Lucide React, Motion
- **Full-Stack Runtime**: Express.js with `sql.js` (WebAssembly SQLite) for live preview and instant deployment
- **Backend (Python / Local VS Code)**: Python 3.10+, Flask, SQLite3, Flask-CORS
- **Database**: SQLite (`data/aquawatch.sqlite` and `backend/aquawatch.db`)

---

## 📁 Project Structure

```text
aquawatch/
├── backend/
│   ├── app.py                # Flask REST API server
│   ├── database.py           # SQLite connection, schema, and seeding
│   ├── models.py             # Data models and input validation
│   └── requirements.txt      # Python dependencies
├── data/
│   └── aquawatch.sqlite      # SQLite database file
├── server/
│   └── db.ts                 # SQLite driver and schema initialization
├── src/
│   ├── components/           # UI components (KPI cards, modals, navigation)
│   ├── pages/                # Analytics, Waste Tracking, Surveys, Recommendations
│   ├── services/             # REST API client
│   ├── App.tsx               # Root application shell
│   ├── main.tsx              # React DOM entry
│   └── index.css             # Tailwind CSS & typography
├── index.html                # HTML entry point with metadata
├── package.json              # Frontend & fullstack scripts
├── server.ts                 # Full-stack server
├── tsconfig.json             # TypeScript compiler settings
└── README.md                 # Project documentation
```

---

## 🚀 Running Locally in VS Code & Windows

### Option A: Complete Web App via Node.js (Vite + Express + SQLite)

This runs the full-stack system with zero external database dependencies:

1. **Open the project in VS Code**:
   ```powershell
   code .
   ```

2. **Install Node.js dependencies**:
   ```powershell
   npm install
   ```

3. **Start the development server**:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

### Option B: Running Python Flask Backend + React Frontend

If you wish to run the Python Flask backend independently:

#### 1. Setup & Run the Python Flask Backend
1. Open a new terminal in VS Code:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *(If script execution is restricted on Windows, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell)*

3. Install required packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```powershell
   python app.py
   ```
   The Flask API will run on `http://localhost:5000`.

#### 2. Run the React Frontend
1. Open a second terminal in VS Code:
   ```powershell
   npm install
   npm run dev
   ```
2. The frontend will run on `http://localhost:3000` and communicate with the backend.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Returns 4 primary KPIs, trends, and data availability flags |
| `GET` | `/api/water-usage` | Retrieves time-series usage with location and date filters |
| `POST` | `/api/water-usage` | Records a new water meter measurement |
| `GET` | `/api/waste-reports` | Returns water waste incidents categorized by type |
| `POST` | `/api/waste-reports` | Submits a new water waste report |
| `PATCH` | `/api/waste-reports/:id` | Updates waste incident status (`Reported`, `In Progress`, `Resolved`) |
| `GET` | `/api/surveys` | Retrieves student habit survey records and percentage summaries |
| `POST` | `/api/surveys` | Submits new student survey results and recalculates percentages |
| `GET` | `/api/recommendations` | Generates rule-based conservation actions and dynamic triggers |
| `PATCH` | `/api/recommendations/:id` | Toggles action status (`Pending` ↔ `Completed`) |
| `POST` | `/api/recommendations` | Adds a custom conservation action |
| `GET` | `/api/conservation-score`| Calculates the documented score from available indicators |
| `GET` | `/api/inspections` | Returns facility inspection records |
| `POST` | `/api/inspections` | Records a new zone inspection |

---

## 🧮 Water Conservation Scoring Methodology

The conservation score evaluates campus and household water stewardship on a transparent **0 to 100** scale:

$$\text{Total Score} = S_{\text{reduction}} + S_{\text{leak}} + S_{\text{inspection}} + S_{\text{survey}}$$

1. **Consumption Reduction (35% weight)**:
   - Compares the average daily usage in the evaluation window against the documented pre-intervention baseline.
   - A measured $\ge 20\%$ reduction achieves the full 35 points.
   - Partial reductions earn proportional points: $\min\left(35, \frac{\% \text{ reduction}}{20} \times 35\right)$.

2. **Leak Incident Resolution Rate (25% weight)**:
   - Ratio of resolved leak incidents to total reported leaks: $\frac{\text{Resolved Leaks}}{\text{Total Leaks}} \times 25$.
   - Zero reported leaks award full 25 points for pristine plumbing maintenance.

3. **Facility Inspection Compliance (20% weight)**:
   - Evaluates regular maintenance checks across washrooms, cafeterias, and gardens (Target: 3+ routine audits).

4. **Student & Community Survey Engagement (20% weight)**:
   - Evaluates student participation in water habit monitoring (Target: $\ge 20$ valid student responses).

*If fewer than two indicators have valid measurement records, the dashboard displays **"Insufficient data"** to prevent misleading scores.*

---

## 🛡️ Data Integrity Notice

Every pre-loaded record is explicitly categorized with `data_type = 'illustrative'` to maintain academic and operational honesty. When users record real sensor measurements or student survey responses, they are tagged as `actual` and evaluated distinctly without synthetic contamination.

---

**Developed for AquaWatch — Save Every Drop.**
