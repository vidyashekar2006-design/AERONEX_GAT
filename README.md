✈️ AERONEX

AI-Enabled Real-Time Digital Twin for Aero Piston Engines

Smart India Hackathon 2026 | Team AETHERIS_GAT | Team ID: 149433

AERONEX is an AI-enabled real-time Digital Twin platform for health monitoring, fault prediction, degradation analysis, Remaining Useful Life (RUL) estimation, and mission reliability enhancement of aero piston engines used in MALE UAVs.

The platform connects engine telemetry → Digital Twin → AI/ML analysis → prognostics → mission simulation → decision support through a unified web-based system.

---

🎯 Problem

Aero piston engines generate multiple telemetry parameters during operation, including:

- RPM
- Manifold pressure
- Oil pressure
- Oil temperature
- CHT
- EGT
- Fuel flow
- Vibration
- Engine load
- Throttle
- Altitude
- Ambient temperature and pressure

Monitoring these parameters individually does not provide a complete picture of engine health, degradation, or future failure risk.

AERONEX transforms telemetry into predictive intelligence so that operators can understand:

«What is happening now → What is going wrong → How the engine is degrading → What may happen next → How the mission could be affected»

---

💡 AERONEX Solution

AERONEX combines multiple layers into one predictive maintenance ecosystem.

                 ┌─────────────────────────┐
                 │   ENGINE / SIMULATOR     │
                 │     TELEMETRY SOURCE     │
                 └────────────┬────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │    DATA INGESTION       │
                 │  Validation & Processing │
                 └────────────┬────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │       FASTAPI           │
                 │      BACKEND            │
                 └────────────┬────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
       ┌─────────────────┐       ┌─────────────────┐
       │    DATABASE     │       │  DIGITAL TWIN   │
       │ Supabase / SQL  │       │ Engine State    │
       └────────┬────────┘       └────────┬────────┘
                │                         │
                └────────────┬────────────┘
                             ▼
                  ┌──────────────────────┐
                  │      AI / ML         │
                  │ Health & Fault       │
                  │ Analysis             │
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌─────────────┐
       │ Anomaly /  │ │Degradation │ │     RUL     │
       │ Fault      │ │ Analysis   │ │ Estimation  │
       │ Detection  │ │            │ │             │
       └─────┬──────┘ └─────┬──────┘ └──────┬──────┘
             │              │               │
             └──────────────┼───────────────┘
                            ▼
                 ┌────────────────────────┐
                 │   MISSION SIMULATION   │
                 │  Scenario & Reliability│
                 │       Analysis         │
                 └────────────┬───────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │    DECISION SUPPORT    │
                 │ Alerts • Insights •    │
                 │ Maintenance Guidance   │
                 └────────────┬───────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │    REACT DASHBOARD     │
                 │ Real-Time Visualization│
                 └────────────────────────┘

---

🏗️ System Architecture

AERONEX is organized into five major layers.

1️⃣ Data Layer

The system receives engine telemetry containing physical and environmental parameters.

Engine / Simulator
       ↓
Telemetry
       ↓
Structured Data Contract

The standardized telemetry structure allows every module to work with the same data format.

---

2️⃣ Backend & Data Processing Layer

The FastAPI backend acts as the central communication layer.

Frontend
   ↕
FastAPI
   ↕
ML / Digital Twin / Simulation
   ↕
Database

The backend is responsible for:

- Receiving telemetry
- Validating incoming data
- Routing requests
- Communicating with ML modules
- Accessing stored engine data
- Serving analysis results
- Providing alerts and health information
- Supporting real-time communication

---

3️⃣ Digital Twin Layer

The Digital Twin maintains a virtual representation of the engine's current operational state.

Telemetry
    ↓
Engine Parameters
    ↓
Virtual Engine State
    ↓
Health / Degradation Representation

As new telemetry arrives, the Digital Twin can be updated to represent the corresponding engine condition.

This creates a bridge between:

Physical Engine ↔ Digital Representation

---

4️⃣ AI / ML Layer

The intelligence layer analyzes telemetry and engine-state information.

                Telemetry
                    ↓
            Data Preprocessing
                    ↓
             Feature Analysis
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   Fault / Anomaly         Health Analysis
     Detection                  ↓
        │                 Degradation
        │                    Analysis
        └───────────┬───────────┘
                    ↓
              Prognostics
                    ↓
             RUL Estimation

The ML layer is intended to identify patterns that may not be obvious from individual sensor readings.

---

5️⃣ Mission & Decision Layer

Engine health is not considered in isolation.

AERONEX connects engine condition with mission scenarios.

Engine Health
     +
Degradation
     +
RUL
     +
Mission Conditions
     ↓
Mission Simulation
     ↓
Reliability Analysis
     ↓
Decision Support

This allows the system to move beyond component-level monitoring toward mission-aware engine reliability analysis.

---

🔄 End-to-End Data Flow

The complete AERONEX pipeline can be summarized as:

1. TELEMETRY GENERATION
        ↓
2. DATA INGESTION
        ↓
3. VALIDATION & PREPROCESSING
        ↓
4. DATABASE STORAGE
        ↓
5. DIGITAL TWIN UPDATE
        ↓
6. AI / ML ANALYSIS
        ↓
7. ANOMALY & FAULT DETECTION
        ↓
8. DEGRADATION ANALYSIS
        ↓
9. RUL / PROGNOSTICS
        ↓
10. MISSION SIMULATION
        ↓
11. DECISION SUPPORT
        ↓
12. DASHBOARD VISUALIZATION

---

🤖 Machine Learning Pipeline

AERONEX uses machine learning as part of its predictive maintenance architecture.

Input

Engine telemetry:

RPM
MAP
Oil Pressure
Oil Temperature
CHT
EGT
Fuel Flow
Vibration
Throttle
Engine Load
Altitude
Ambient Conditions

Processing

Raw Telemetry
      ↓
Cleaning
      ↓
Validation
      ↓
Feature Preparation
      ↓
ML Model
      ↓
Health / Fault Prediction
      ↓
Degradation & Prognostics

Output

The ML layer can provide information such as:

- Anomaly status
- Fault condition
- Fault severity
- Engine health state
- Degradation trend
- RUL estimate

---

🪞 Digital Twin

The Digital Twin is one of the core concepts of AERONEX.

Instead of treating telemetry as isolated numbers, AERONEX uses the incoming data to represent the current state of the engine digitally.

                PHYSICAL WORLD

              Aero Piston Engine
                      │
                      │ Telemetry
                      ▼
               ┌─────────────┐
               │   AERONEX   │
               │ Digital Twin│
               └──────┬──────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Health      Faults      Degradation
          │           │           │
          └───────────┼───────────┘
                      ▼
                 Prognostics
                      │
                      ▼
                Mission Impact

---

🚨 Fault & Anomaly Detection

AERONEX analyzes engine behavior to identify abnormal operating patterns.

The system considers fault categories such as:

Fault Category| Example Indicators
Lubrication| Oil pressure / temperature abnormalities
Cooling| CHT / thermal abnormalities
Bearing| Abnormal vibration patterns
Overheating| Elevated thermal parameters
Performance| Abnormal engine performance
Sensor Fault| Inconsistent telemetry behavior

The purpose is to provide an early indication that an engine may require further investigation.

---

⏳ Prognostics & RUL

AERONEX extends monitoring from current condition to future condition.

Historical Engine Behavior
          +
Current Engine State
          +
Degradation Pattern
          ↓
      Prognostics
          ↓
   RUL Estimation

RUL — Remaining Useful Life represents an estimate of how much operational life remains before the engine reaches a defined degraded or failure condition.

---

🛫 Mission Simulation

The mission simulation layer evaluates engine behavior under different operational scenarios.

Example mission variables include:

- Altitude
- Engine load
- Throttle
- Operating duration
- Environmental conditions
- Engine health state

Mission Parameters
       ↓
Engine Operating Conditions
       ↓
Engine Response
       ↓
Health / Degradation
       ↓
Mission Reliability Analysis

This connects predictive engine health with mission-level analysis.

---

🧠 Decision Support

The final objective is not simply to produce ML predictions.

AERONEX converts technical outputs into information that can support engineering decisions.

Raw Data
   ↓
Information
   ↓
Prediction
   ↓
Risk / Health Insight
   ↓
Decision Support

Examples of dashboard information include:

- Current engine health
- Active alerts
- Detected anomalies
- Fault information
- Degradation trends
- RUL
- Mission impact

---

📡 Backend Architecture

The AERONEX backend is built using FastAPI.

                    ┌──────────────┐
                    │    React     │
                    │  Dashboard   │
                    └──────┬───────┘
                           │
                    HTTP / WebSocket
                           │
                           ▼
                  ┌─────────────────┐
                  │     FastAPI     │
                  │      API        │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   Telemetry           Analysis           Alerts
      API                API                API
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
          ML / Digital Twin      Database
                │                     │
                └──────────┬──────────┘
                           ▼
                     API Response
                           │
                           ▼
                       Dashboard

---

🔌 API Communication

The frontend communicates with the backend through APIs.

Example:

POST /api/telemetry

Telemetry is sent as structured JSON.

Example:

{
  "engine_id": "ENG001",
  "rpm": 2450,
  "oil_pressure": 48.5,
  "oil_temperature": 92.4,
  "cht": 165.2,
  "egt": 710.5,
  "fuel_flow": 12.4,
  "vibration": 0.18,
  "throttle": 72,
  "engine_load": 68
}

FastAPI validates the incoming request before passing the data to the relevant backend components.

---

🗄️ Database Architecture

The database provides persistent storage for engine and telemetry information.

                FastAPI
                   │
                   ▼
             Database Layer
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    Telemetry   Engine      Mission
      Data       Data        Data
        │          │          │
        └──────────┼──────────┘
                   ▼
             ML / Analysis

The deployment architecture uses Supabase/PostgreSQL for cloud database integration.

---

🖥️ Frontend

The AERONEX dashboard is built using:

- React
- TypeScript
- Vite
- Data visualization components

The dashboard presents the outputs of the backend and intelligence layers in an operator-friendly interface.

Key dashboard areas include:

Dashboard
├── Engine Overview
├── Live Telemetry
├── Health Monitoring
├── Fault & Anomaly Alerts
├── Degradation
├── RUL
├── Mission Analysis
└── Decision Support

---

🛠️ Technology Stack

Layer| Technologies
Frontend| React, TypeScript, Vite
Backend| Python, FastAPI
Validation| Pydantic
Database ORM| SQLAlchemy
Database| PostgreSQL / Supabase
ML| Python, Scikit-learn, Pandas, NumPy
Real-Time| WebSockets
API| REST
Server| Uvicorn
Containerization| Docker
Version Control| Git & GitHub

---

📁 Project Structure

AERONEX_GAT/
│
├── Backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── Database/
│   └── Database components
│
├── Frontend/
│   └── React application
│
├── ML/
│   └── Machine Learning pipeline
│
├── Simulation/
│   └── Engine / mission simulation
│
└── README.md

---

🚀 Running the Project

1. Clone the repository

git clone <YOUR_REPOSITORY_URL>
cd AERONEX_GAT

2. Backend Setup

cd Backend
python -m venv venv

Activate the environment on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Run the backend:

python -m uvicorn app.main:app --reload --port 8001

Backend API:

http://localhost:8001

Interactive API documentation:

http://localhost:8001/docs

---

🔐 Environment Configuration

Create a ".env" file based on ".env.example".

Typical configuration includes database and application settings.

«Never commit production credentials, API keys, passwords, or secret environment variables to GitHub.»

---

🐳 Docker

Docker provides a consistent environment for running the application and its dependencies.

Application
     ↓
Docker Image
     ↓
Container
     ↓
Consistent Runtime Environment

This helps reduce environment-specific deployment issues when moving from local development to deployment.

---

📈 Current Implementation

AERONEX currently demonstrates the complete predictive engine-monitoring workflow using simulated engine telemetry.

The architecture is designed so that the telemetry source can be replaced with real engine/IoT/avionics telemetry in future deployments.

Current:

Simulator → AERONEX → AI/ML → Dashboard

Future:

Real Engine → Sensors/Telemetry → AERONEX → AI/ML → Dashboard

---

🔮 Future Scope

Real Engine Integration

Connect AERONEX to real UAV engine telemetry.

Edge AI

Deploy lightweight inference closer to the engine for low-latency analysis.

Physics-Informed Digital Twin

Combine physical engine equations with data-driven ML models.

Explainable AI

Provide explanations for why the system identified a fault or abnormal condition.

Fleet Intelligence

Monitor multiple UAV engines simultaneously.

Advanced Time-Series Models

Explore advanced temporal forecasting and sequence models for degradation and RUL estimation.

Automated Maintenance Planning

Convert predictions into maintenance scheduling recommendations.

---

🌟 Why AERONEX?

AERONEX is designed as more than a telemetry dashboard.

        MONITOR
           ↓
        UNDERSTAND
           ↓
        PREDICT
           ↓
        SIMULATE
           ↓
        SUPPORT
        DECISIONS

It brings together:

Real-Time Monitoring + Digital Twin + AI/ML + Fault Detection + Prognostics + RUL + Mission Simulation + Decision Support

into a single platform for intelligent aero-engine health management.

---

👥 Team AETHERIS_GAT

Smart India Hackathon 2026

Team ID: 149433

Member| Contribution
Vidya M| Backend
Srushti| ML
Sab| Frontend 
Krutin Bhat| Database
Samarth| Simulation
Deekshith| UI & Presentation

---

🏆 Project Vision

«From monitoring engine parameters to predicting engine behavior and understanding mission impact.»

AERONEX — Turning Engine Telemetry into Predictive Intelligence.

---

<p align="center">✈️ AERONEX | Team AETHERIS_GAT | 149433

</p>
