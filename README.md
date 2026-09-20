✈️ AERONEX_GAT

AI-Enabled Real-Time Digital Twin for Aero Piston Engines

Smart India Hackathon 2026 | Team AETHERIS_GAT | Team No. 149433

«Turning Engine Telemetry into Predictive Intelligence»

---

🌐 Live Demo

🛩️ AERONEX Main Dashboard

https://aeronex-frontend-khgt.onrender.com

⚙️ Engine Simulation & Digital Twin

https://aeronex-simulation-frontend.onrender.com

AERONEX consists of an interactive engine simulation environment and a real-time monitoring dashboard, connected through the backend and AI/ML pipeline.

---

🎯 Problem Statement

Aero piston engines used in MALE UAVs operate under continuously changing environmental and operating conditions.

Important engine parameters include:

- RPM
- Manifold Pressure (MAP)
- Oil Pressure
- Oil Temperature
- Cylinder Head Temperature (CHT)
- Exhaust Gas Temperature (EGT)
- Fuel Flow
- Vibration
- Throttle
- Engine Load
- Altitude
- Ambient Temperature
- Ambient Pressure

Monitoring these parameters individually does not provide a complete picture of:

- Current engine health
- Abnormal operating behavior
- Fault conditions
- Degradation
- Remaining Useful Life (RUL)
- Potential mission impact

AERONEX addresses this gap by transforming raw engine telemetry into predictive and mission-oriented intelligence.

---

💡 Our Solution

AERONEX is an AI-enabled Digital Twin and predictive engine-health platform that integrates:

Engine Simulation → Telemetry → Feature Engineering → AI/ML → Digital Twin → Prognostics → Mission Analysis → Decision Support

The system answers the complete chain:

What is happening?
        ↓
Is the behavior abnormal?
        ↓
What type of fault may be present?
        ↓
How is the engine degrading?
        ↓
What is the estimated remaining useful life?
        ↓
How could the condition affect the mission?

---

🏗️ AERONEX Architecture

The core AERONEX architecture is:

                    ┌──────────────────┐
                    │    SIMULATION    │
                    │ Engine Telemetry │
                    └────────┬─────────┘
                             │
                             │ Raw Engine Telemetry
                             ▼
                    ┌──────────────────┐
                    │    TELEMETRY     │
                    │    INGESTION     │
                    └────────┬─────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
                   ▼                   ▼
          ┌─────────────────┐   ┌─────────────────┐
          │    DATABASE     │   │ FEATURE         │
          │ Telemetry Data  │   │ ENGINEERING     │
          └─────────────────┘   └────────┬────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
                  ▼                      ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
        │    ANOMALY      │    │     FAULT       │    │   DEGRADATION /  │
        │    DETECTION    │    │  CLASSIFICATION │    │       RUL         │
        └────────┬────────┘    └────────┬────────┘    └────────┬─────────┘
                 │                      │                      │
                 ▼                      ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
        │ Isolation Forest│    │ XGBoost         │    │ XGBoost          │
        │                 │    │ Classifier      │    │ Regressor        │
        └────────┬────────┘    └────────┬────────┘    └────────┬─────────┘
                 │                      │                      │
                 └──────────────────────┼──────────────────────┘
                                        ▼
                              ┌──────────────────┐
                              │ AERONEX BACKEND  │
                              │     FastAPI      │
                              └────────┬─────────┘
                                       │
                                  WebSocket
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ AERONEX FRONTEND │
                              │ React Dashboard  │
                              └──────────────────┘

In one line:

Simulation
    ↓
Raw Engine Telemetry
    ↓
Telemetry Ingestion
    ↓
Feature Engineering
    ↓
┌──────────────┬──────────────────┬──────────────────┐
│              │                  │
▼              ▼                  ▼
Anomaly       Fault              Degradation / RUL
Detection     Classification
│              │                  │
▼              ▼                  ▼
Isolation     XGBoost            XGBoost
Forest        Classifier         Regressor
└──────────────┴──────────────────┴──────────────────┘
                       ↓
                AERONEX Backend
                    FastAPI
                       ↓
                   WebSocket
                       ↓
                AERONEX Frontend

---

🔄 End-to-End Data Flow

AERONEX processes engine information through the following stages:

1. ENGINE SIMULATION
        ↓
2. RAW ENGINE TELEMETRY
        ↓
3. TELEMETRY INGESTION
        ↓
4. DATABASE STORAGE
        ↓
5. FEATURE ENGINEERING
        ↓
6. PARALLEL AI/ML ANALYSIS
        │
        ├──→ Anomaly Detection
        │        ↓
        │   Isolation Forest
        │
        ├──→ Fault Classification
        │        ↓
        │   XGBoost Classifier
        │
        └──→ Degradation / RUL
                 ↓
            XGBoost Regressor
        ↓
7. AERONEX BACKEND
        ↓
8. WEBSOCKET
        ↓
9. AERONEX FRONTEND
        ↓
10. REAL-TIME ENGINE INSIGHTS

---

🤖 AI / Machine Learning Architecture

The AERONEX ML pipeline consists of three major intelligence components.

1️⃣ Anomaly Detection — Isolation Forest

The Isolation Forest model is used for anomaly detection.

Engine Telemetry
       ↓
Feature Engineering
       ↓
Isolation Forest
       ↓
Normal / Anomalous Behavior

Its purpose is to identify telemetry patterns that deviate from expected operating behavior.

This allows AERONEX to detect potentially abnormal engine conditions before relying solely on predefined fault labels.

---

2️⃣ Fault Classification — XGBoost Classifier

When analyzing engine behavior for potential fault conditions, AERONEX uses an XGBoost Classifier.

Engine Features
       ↓
XGBoost Classifier
       ↓
Predicted Fault Class
       ↓
Fault Information

The classifier can be used to distinguish between different engine fault categories represented in the training data.

Examples include:

- Lubrication
- Cooling
- Bearing
- Overheating
- Performance
- Sensor-related faults

---

3️⃣ Degradation / RUL — XGBoost Regressor

The degradation and RUL pipeline uses an XGBoost Regressor.

Engine Features
       ↓
XGBoost Regressor
       ↓
Degradation / RUL Output
       ↓
Prognostic Information

The regression model produces a continuous numerical prediction used by the degradation/prognostics component.

RUL

RUL — Remaining Useful Life represents an estimate of the remaining operational life under the defined modelling assumptions and target conditions.

---

🧠 Why Three ML Components?

AERONEX separates different predictive tasks instead of treating every engine-health problem as a single ML problem.

                    Engine Telemetry
                           │
                    Feature Engineering
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          "Is it        "What type      "How much
          abnormal?"     of fault?"      life remains?"
             │             │             │
             ▼             ▼             ▼
        Isolation       XGBoost        XGBoost
         Forest        Classifier      Regressor
             │             │             │
             ▼             ▼             ▼
         Anomaly         Fault        Degradation /
         Detection     Prediction        RUL

This creates a clear separation between:

Detection → Classification → Regression/Prognostics

---

🧩 Feature Engineering

Raw telemetry is not directly treated as the final ML input.

The pipeline first performs feature engineering to prepare the telemetry for the individual ML models.

Raw Telemetry
      ↓
Data Validation
      ↓
Cleaning / Preparation
      ↓
Feature Engineering
      ↓
ML-Ready Features
      ↓
┌─────────────┬──────────────┬───────────────┐
▼             ▼              ▼
Anomaly       Fault          Degradation /
Detection     Classification RUL

The objective is to convert raw engine measurements into structured features suitable for predictive analysis.

---

📡 Telemetry Layer

The simulation environment generates engine telemetry representing operating conditions.

Typical parameters include:

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
Ambient Temperature
Ambient Pressure

The telemetry follows a structured data contract so that the simulation, backend, database, ML pipeline, and frontend can communicate consistently.

---

🪞 Digital Twin

The Digital Twin provides a virtual representation of the engine's operational state.

                 PHYSICAL / SIMULATED ENGINE
                           │
                           │ Telemetry
                           ▼
                    ┌─────────────┐
                    │   AERONEX   │
                    │ Digital Twin│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Health        Faults     Degradation
              │            │            │
              └────────────┼────────────┘
                           ▼
                       Prognostics
                           │
                           ▼
                     Mission Impact

The Digital Twin connects the incoming telemetry with the engine's represented state, allowing the system to visualize and analyze changing engine conditions.

---

⚡ FastAPI Backend

The FastAPI backend acts as the central orchestration and communication layer.

                       AERONEX BACKEND
                             │
                         FastAPI API
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    Telemetry API       Analysis API        Alerts API
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
           Database       AI / ML      Digital Twin
                             │
                             ▼
                        ML Results
                             │
                             ▼
                         WebSocket
                             │
                             ▼
                      React Frontend

Backend responsibilities

- Receive telemetry
- Validate incoming data
- Route requests
- Connect ML components
- Access database information
- Serve engine-health information
- Deliver analysis results
- Provide alerts
- Handle frontend communication
- Support real-time updates

---

🔌 Communication Architecture

The system uses different communication mechanisms for different requirements.

REST API

Used for structured request/response communication between the frontend and backend.

Example:

POST /api/telemetry

WebSocket

Used for real-time bidirectional communication where live engine information needs to be pushed to the dashboard.

Backend
   │
   │ WebSocket
   │
   ▼
Frontend
   │
   ▼
Real-Time Dashboard Updates

This allows the dashboard to receive changing engine information without repeatedly relying only on conventional request/response cycles.

---

🗄️ Database Architecture

Telemetry and application data are persisted through the database layer.

                    FastAPI
                       │
                       ▼
                Database Layer
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Telemetry      Engine       Mission
        Data          Data         Data
          │            │            │
          └────────────┼────────────┘
                       ▼
                  ML / Analysis

The deployment architecture uses PostgreSQL/Supabase for cloud database integration.

---

🚨 Fault & Anomaly Detection

AERONEX uses two complementary approaches:

                    Engine Features
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      Anomaly Detection          Fault Classification
             │                           │
             ▼                           ▼
      Isolation Forest             XGBoost Classifier
             │                           │
             ▼                           ▼
       Anomalous State              Fault Class

Anomaly Detection

Answers:

«"Does this behavior look abnormal?"»

Fault Classification

Answers:

«"If abnormal, what fault category does the behavior correspond to?"»

This separation makes the predictive pipeline easier to interpret and extend.

---

📉 Degradation Analysis

Engine health is not only about detecting a fault at a single instant.

AERONEX also analyzes degradation behavior.

Historical / Current Telemetry
              ↓
       Feature Engineering
              ↓
       XGBoost Regressor
              ↓
      Degradation / RUL
              ↓
         Prognostics

This enables the system to move from simple monitoring toward predictive engine-health analysis.

---

⏳ RUL — Remaining Useful Life

RUL is incorporated into the prognostics pipeline.

Current Engine Features
          +
Degradation Information
          ↓
   XGBoost Regressor
          ↓
      RUL Output

The RUL output provides a numerical estimate based on the trained regression model and the conditions represented in the data.

---

🛫 Mission Simulation

Engine health is evaluated alongside mission conditions.

Example mission variables include:

- Altitude
- Engine load
- Throttle
- Operating duration
- Environmental conditions
- Engine health state

Mission Parameters
       ↓
Operating Conditions
       ↓
Engine Response
       ↓
Health / Degradation
       ↓
Mission Reliability Analysis
       ↓
Decision Support

This connects engine-level predictive analysis with mission-level context.

---

🧠 Decision Support

The final objective is to convert technical engine information into useful operational insights.

Raw Telemetry
      ↓
Feature Engineering
      ↓
AI / ML Analysis
      ↓
Health + Fault + Degradation + RUL
      ↓
Mission Context
      ↓
Decision Support
      ↓
Dashboard

The dashboard can present:

- Current engine health
- Telemetry
- Active alerts
- Anomalies
- Fault information
- Degradation trends
- RUL
- Mission analysis

---

📊 Telemetry Parameters

Parameter| Purpose
RPM| Engine rotational speed
MAP| Manifold pressure
Oil Pressure| Lubrication-system monitoring
Oil Temperature| Thermal/lubrication monitoring
CHT| Cylinder thermal condition
EGT| Exhaust/combustion condition
Fuel Flow| Fuel consumption behavior
Vibration| Mechanical condition monitoring
Throttle| Engine demand
Engine Load| Operating load
Altitude| Mission/environmental condition
Ambient Temperature| Environmental influence
Ambient Pressure| Environmental influence

---

🖥️ Frontend Architecture

The AERONEX dashboard is built using React, TypeScript and Vite.

                       AERONEX FRONTEND
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   Engine Overview      Live Telemetry      Health Status
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                         Alerts
                              │
                              ▼
                      AI / ML Results
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
              Anomaly       Fault       RUL /
              Status        Status    Degradation
                 │            │            │
                 └────────────┼────────────┘
                              ▼
                      Mission Analysis
                              │
                              ▼
                       Decision Support

---

🛠️ Technology Stack

Layer| Technologies
Frontend| React, TypeScript, Vite
Backend| Python, FastAPI
Data Validation| Pydantic
Database ORM| SQLAlchemy
Database| PostgreSQL / Supabase
Anomaly Detection| Isolation Forest
Fault Classification| XGBoost Classifier
Degradation / RUL| XGBoost Regressor
Data Processing| Pandas, NumPy
Real-Time Communication| WebSockets
API| REST
Server| Uvicorn
Containerization| Docker
Version Control| Git & GitHub
Deployment| Render / Supabase

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

🚀 Running AERONEX Locally

1. Clone the Repository

git clone <YOUR_REPOSITORY_URL>
cd AERONEX_GAT

---

2. Backend Setup

cd Backend
python -m venv venv

Windows

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Run the backend:

python -m uvicorn app.main:app --reload --port 8001

Backend:

http://localhost:8001

FastAPI documentation:

http://localhost:8001/docs

---

🔐 Environment Configuration

Create a ".env" file using ".env.example" as a reference.

Configure the required:

- Database connection
- Supabase credentials
- API configuration
- Environment variables

«⚠️ Never commit passwords, API keys, database credentials, or other secrets to GitHub.»

---

🐳 Docker

Docker provides a consistent runtime environment for the application.

Application
      ↓
Docker Image
      ↓
Container
      ↓
Consistent Runtime Environment
      ↓
Deployment

This helps reduce environment-specific deployment issues.

---

🌐 Deployment Architecture

The deployed system separates the simulation interface and main dashboard while connecting them through the AERONEX backend and data services.

                       USER
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
      Simulation UI          Main Dashboard
             │                     │
             └──────────┬──────────┘
                        ▼
                 AERONEX Backend
                     FastAPI
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          Database              AI / ML
         Supabase              Pipeline
              │                   │
              └─────────┬─────────┘
                        ▼
                 Engine Intelligence
                        │
                     WebSocket
                        │
                        ▼
                  Live Dashboard

---

🔗 Live System Flow

┌──────────────────────────────────────────────────────────┐
│                    AERONEX_GAT
