✈️ AERONEX_GAT

AI-Enabled Real-Time Digital Twin for Aero Piston Engines

Smart India Hackathon 2026 | Team AETHERIS_GAT | Team No. 149433

«Turning Engine Telemetry into Predictive Intelligence»

---

🚀 Live Demo

Main Dashboard

https://aeronex-frontend-khgt.onrender.com

Engine Simulation & Digital Twin

https://aeronex-simulation-frontend.onrender.com

---

🎯 Problem Statement

Aero piston engines used in MALE UAVs operate under continuously changing operating and environmental conditions.

Important engine parameters include:

- RPM
- MAP / Manifold Pressure
- Oil Pressure
- Oil Temperature
- CHT — Cylinder Head Temperature
- EGT — Exhaust Gas Temperature
- Fuel Flow
- Vibration
- Throttle
- Engine Load
- Altitude
- Ambient Temperature
- Ambient Pressure

Traditional monitoring systems mainly display individual parameters and threshold-based warnings.

However, this does not provide a complete understanding of:

- Current engine health
- Abnormal operating behavior
- Potential fault type
- Engine degradation
- Remaining Useful Life (RUL)
- Impact on mission reliability

AERONEX addresses this gap by transforming engine telemetry into predictive and mission-oriented intelligence.

---

💡 Our Solution

AERONEX combines:

Engine Simulation + Telemetry Processing + Feature Engineering + AI/ML + Digital Twin + Prognostics + Mission Simulation + Decision Support

The system follows a simple intelligence chain:

«What is happening?
↓
Is the engine behaving abnormally?
↓
What type of fault is occurring?
↓
How is the engine degrading?
↓
What is the estimated RUL?
↓
Could it affect the mission?»

---

🔄 DATA FLOW

The following represents the core AERONEX data flow from engine simulation to the user interface.

                         Simulation
                              │
                              │ Raw Engine Telemetry
                              ▼
                    Telemetry Ingestion
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
                Database        Feature Engineering
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
       Anomaly Detection       Fault Classification       Degradation / RUL
              │                         │                         │
              ▼                         ▼                         ▼
       Isolation Forest         XGBoost Classifier        XGBoost Regressor
              │                         │                         │
              └─────────────────────────┼─────────────────────────┘
                                        ▼
                               AERONEX Backend
                                        │
                                    WebSocket
                                        │
                                        ▼
                               AERONEX Frontend

Data Flow Explanation

1. Simulation

The engine simulation generates realistic operational telemetry representing the behavior of an aero piston engine.

2. Raw Engine Telemetry

The simulator produces parameters such as RPM, MAP, oil pressure, temperatures, fuel flow, vibration, throttle, altitude and engine load.

3. Telemetry Ingestion

The backend receives and validates the incoming telemetry before processing it further.

4. Database

The incoming telemetry is stored for historical analysis, monitoring and future model improvement.

5. Feature Engineering

Raw telemetry is transformed into meaningful features required by the AI/ML models.

6. Anomaly Detection — Isolation Forest

Isolation Forest identifies telemetry patterns that deviate significantly from normal engine behavior.

7. Fault Classification — XGBoost Classifier

When abnormal behavior is detected, the classifier determines the corresponding fault category based on the engineered features.

8. Degradation / RUL — XGBoost Regressor

The regression model estimates the engine's degradation/RUL output based on the available telemetry and engineered features.

9. AERONEX Backend

The FastAPI backend coordinates the processed results and exposes them to the frontend.

10. WebSocket

WebSocket provides real-time communication so that updated engine conditions and AI results can be pushed to the dashboard without repeatedly refreshing the page.

11. AERONEX Frontend

The React dashboard presents engine health, anomalies, faults, degradation, RUL and other mission-relevant information to the user.

---

🧠 AI/ML ARCHITECTURE

AERONEX separates its AI pipeline into three major intelligence components.

1. Anomaly Detection

Model: Isolation Forest

Isolation Forest is used to identify unusual engine behavior.

It answers:

«"Is the engine behaving differently from expected operating patterns?"»

It is particularly useful for detecting abnormal telemetry patterns without requiring every possible abnormal condition to be explicitly labeled.

---

2. Fault Classification

Model: XGBoost Classifier

The XGBoost classifier analyzes engineered telemetry features to classify the detected fault.

It answers:

«"What type of fault is most consistent with the observed engine behavior?"»

Example fault categories include:

- Lubrication
- Cooling
- Bearing
- Overheating
- Performance
- Sensor-related faults

---

3. Degradation / RUL Estimation

Model: XGBoost Regressor

The XGBoost regression model produces the degradation/RUL output from the available engine features.

It answers:

«"How is the engine condition changing, and what is the estimated remaining useful life?"»

The output supports predictive maintenance and mission-level decision making.

---

⚙️ FEATURE ENGINEERING

Raw telemetry is not directly treated as the final model input.

The feature-engineering layer prepares the telemetry for machine-learning inference.

Typical operations include:

- Selecting relevant parameters
- Cleaning incoming values
- Handling missing or invalid values
- Transforming raw measurements
- Creating meaningful derived features
- Preparing features in the format expected by the trained models

This creates a consistent input pipeline between telemetry ingestion and AI/ML inference.

---

📡 TELEMETRY LAYER

AERONEX works with structured engine telemetry.

Parameter| Purpose
RPM| Engine rotational speed
MAP| Manifold pressure
Oil Pressure| Lubrication-system condition
Oil Temperature| Lubrication/thermal condition
CHT| Cylinder thermal condition
EGT| Exhaust thermal condition
Fuel Flow| Fuel consumption behavior
Vibration| Mechanical abnormality indicator
Throttle| Engine power demand
Engine Load| Current engine loading
Altitude| Operating environment
Ambient Temperature| Environmental condition
Ambient Pressure| Environmental condition
Timestamp| Temporal tracking
Engine ID| Identifies the engine
Mission ID| Links telemetry to a mission

---

🪞 DIGITAL TWIN

The AERONEX Digital Twin acts as a virtual representation of the engine's operational state.

It continuously reflects information derived from telemetry and AI/ML analysis.

The Digital Twin can represent:

- Current operating condition
- Engine health
- Detected anomalies
- Fault information
- Degradation
- RUL
- Mission-related engine state

Instead of only displaying raw sensor values, the system converts telemetry into an interpretable representation of engine condition.

---

⚡ FASTAPI BACKEND

AERONEX uses FastAPI as the backend framework.

The backend acts as the central communication and processing layer between:

Telemetry / ML
      │
      ▼
FastAPI Backend
      │
      ├── Database
      │
      ├── ML Results
      │
      ├── Digital Twin
      │
      ├── Mission Analysis
      │
      └── Frontend

Why FastAPI?

FastAPI was selected because it provides:

- High-performance asynchronous APIs
- Native Python support
- Easy integration with ML models
- Pydantic-based validation
- Automatic OpenAPI documentation
- WebSocket support
- Clean API development
- Easy integration with React-based frontends

---

🔌 API COMMUNICATION

The backend exposes REST endpoints for structured communication.

Example:

POST /api/telemetry

This endpoint can receive structured telemetry data from the simulation or another telemetry source.

Pydantic models validate the incoming request structure before the data enters the processing pipeline.

Example conceptual flow:

Telemetry Source
       │
       ▼
POST /api/telemetry
       │
       ▼
Pydantic Validation
       │
       ▼
Feature Processing
       │
       ▼
AI/ML Inference
       │
       ▼
Database + Results

---

🔄 REAL-TIME COMMUNICATION

AERONEX uses WebSockets for real-time dashboard updates.

Instead of continuously polling the backend:

Frontend ──request──> Backend
Frontend <──response── Backend
Frontend ──request──> Backend
Frontend <──response── Backend

WebSocket enables a persistent communication channel:

Frontend ◄══════════► Backend
          WebSocket

This allows updated engine information and AI results to be delivered to the dashboard in real time.

---

🗄️ DATABASE

The database stores structured telemetry and system information required by the platform.

It supports:

- Historical telemetry
- Engine information
- Mission information
- Fault records
- Health information
- Analysis results
- Degradation information

Deployment Database

The deployment architecture uses PostgreSQL/Supabase for persistent cloud database storage.

---

🚨 ANOMALY & FAULT INTELLIGENCE

AERONEX does not rely only on a single threshold.

The intelligence pipeline combines:

Raw Telemetry
      │
      ▼
Feature Engineering
      │
      ├──────────────► Isolation Forest
      │                     │
      │                     ▼
      │                  Anomaly
      │
      └──────────────► XGBoost Classifier
                            │
                            ▼
                       Fault Category

This allows the system to distinguish between:

Normal operation → Abnormal behavior → Potential fault category

---

📉 DEGRADATION & RUL

The degradation layer focuses on the longer-term health of the engine.

Telemetry
    │
    ▼
Feature Engineering
    │
    ▼
XGBoost Regressor
    │
    ├── Degradation Output
    │
    └── RUL Output

This provides predictive information that can support:

- Maintenance planning
- Engine health assessment
- Mission preparation
- Early intervention
- Reliability analysis

---

🛩️ MISSION SIMULATION

Engine health is not considered independently from mission conditions.

AERONEX can connect engine condition with mission-related parameters such as:

- Altitude
- Throttle
- Engine load
- Environmental conditions
- Mission duration
- Operating conditions

This enables the platform to explore how engine condition may influence mission reliability.

---

🎯 DECISION SUPPORT

The final objective is not simply to generate an ML prediction.

AERONEX converts technical information into actionable intelligence.

Telemetry
    ↓
Anomaly
    ↓
Fault
    ↓
Degradation
    ↓
RUL
    ↓
Mission Impact
    ↓
Decision Support

The dashboard therefore helps users understand:

- What is happening?
- Why might it be happening?
- How severe is the condition?
- How is the engine degrading?
- What is the estimated RUL?
- What could happen during the mission?

---

🖥️ FRONTEND

The AERONEX frontend is built using:

- React
- TypeScript
- Vite

The dashboard visualizes:

- Live telemetry
- Engine health
- Anomaly status
- Fault classification
- Degradation
- RUL
- Digital Twin state
- Mission information
- Alerts
- System status

The frontend receives processed information from the backend and converts it into an operator-friendly visualization.

---

🧩 COMPLETE SYSTEM ARCHITECTURE

                     ┌─────────────────────┐
                     │     Simulation      │
                     └──────────┬──────────┘
                                │
                                │ Raw Telemetry
                                ▼
                     ┌─────────────────────┐
                     │ Telemetry Ingestion │
                     └──────────┬──────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
                  ▼                           ▼
          ┌───────────────┐          ┌───────────────────┐
          │    Database   │          │ Feature Engineering│
          └───────────────┘          └─────────┬─────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     │                         │                         │
                     ▼                         ▼                         ▼
              ┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
              │    Anomaly   │       │ Fault Classification│     │ Degradation / RUL│
              │   Detection  │       └─────────┬────────┘       └─────────┬────────┘
              └──────┬───────┘                 │                          │
                     ▼                         ▼                          ▼
             ┌──────────────┐         ┌──────────────────┐       ┌──────────────────┐
             │Isolation     │         │XGBoost Classifier│       │XGBoost Regressor │
             │Forest        │         └──────────────────┘       └──────────────────┘
             └──────┬───────┘
                    │
                    └──────────────────────┬──────────────────────────────┘
                                           ▼
                                  ┌──────────────────┐
                                  │ AERONEX Backend  │
                                  │    FastAPI       │
                                  └────────┬─────────┘
                                           │
                                      WebSocket
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ AERONEX Frontend │
                                  │ React + TypeScript│
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │    End User      │
                                  └──────────────────┘

---

🛠️ TECHNOLOGY STACK

Layer| Technology
Simulation| Python
Backend| FastAPI
API Server| Uvicorn
Validation| Pydantic
ORM| SQLAlchemy
Database| PostgreSQL / Supabase
ML — Anomaly Detection| Isolation Forest
ML — Classification| XGBoost Classifier
ML — Regression| XGBoost Regressor
Real-Time Communication| WebSocket
Frontend| React
Frontend Language| TypeScript
Build Tool| Vite
Deployment| Render
Containerization| Docker

---

📁 PROJECT STRUCTURE

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
├── Frontend/
│   └── Aeronex-frontend/
│
├── Simulation/
│   └── frontend/
│
├── Ml/
│   ├── models/
│   ├── training/
│   └── preprocessing/
│
├── Database/
│
└── README.md

---

▶️ RUNNING LOCALLY

Backend

cd Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

Backend documentation:

http://127.0.0.1:8001/docs

---

Frontend

cd Frontend/Aeronex-frontend
npm install
npm run dev

---

Simulation Frontend

cd Simulation/frontend
npm install
npm run dev

---

🔐 ENVIRONMENT CONFIGURATION

Create a ".env" file based on ".env.example".

Typical configuration includes:

DATABASE_URL=your_database_connection_string

Additional environment variables can be configured according to the deployment environment.

---

🐳 DOCKER

Docker provides a consistent environment for deploying the backend and its dependencies.

Conceptually:

Docker Container
      │
      ├── FastAPI
      ├── Python
      ├── Dependencies
      └── Application Code

This reduces environment-related inconsistencies between development and deployment.

---

☁️ DEPLOYMENT ARCHITECTURE

                 AERONEX
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   React Frontend        Simulation Frontend
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
             FastAPI Backend
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
      ML Models         PostgreSQL/Supabase

---

🔬 CURRENT IMPLEMENTATION

The current demonstration system includes:

- Engine telemetry simulation
- Telemetry ingestion
- Structured telemetry processing
- Feature engineering
- Isolation Forest anomaly detection
- XGBoost fault classification
- XGBoost regression for degradation/RUL output
- FastAPI backend
- Database integration
- WebSocket-based real-time communication
- React dashboard
- Digital Twin visualization
- Mission-oriented analysis

Current Demo Data

The present demonstration primarily uses simulated engine telemetry.

This allows the complete AERONEX pipeline to be demonstrated in a controlled environment while keeping the architecture ready for integration with real engine telemetry sources.

---

🔮 FUTURE SCOPE

Future development can include:

- Integration with real UAV engine telemetry
- Hardware/sensor integration
- Larger real-world datasets
- Continuous model retraining
- Physics-informed Digital Twin models
- Advanced time-series forecasting
- Improved RUL validation
- Edge deployment
- Multi-engine fleet monitoring
- Explainable AI
- Automated maintenance recommendations
- Mission-aware predictive maintenance

---

🌟 AERONEX IN ONE VIEW

RAW ENGINE TELEMETRY
          ↓
   TELEMETRY INGESTION
          ↓
      DATABASE
          ↓
 FEATURE ENGINEERING
          ↓
 ┌────────┼───────────────┐
 ↓        ↓               ↓
ANOMALY  FAULT         DEGRADATION
DETECTION CLASSIFICATION / RUL
 ↓        ↓               ↓
IF       XGBOOST         XGBOOST
          ↓
     AERONEX BACKEND
          ↓
       WEBSOCKET
          ↓
     AERONEX FRONTEND
          ↓
   PREDICTIVE ENGINE
     INTELLIGENCE

---

👥 TEAM AETHERIS_GAT

Team No.: 149433

Member| Contribution
Vidya M| Backend, ML & System Integration
Srushti| Backend & ML
Sab| Backend & ML
Krutin Bhat| Database
Samarth| Simulation
Deekshith| UI & Presentation

---

🏆 PROJECT VISION

AERONEX aims to move UAV engine monitoring from:

«Reactive Monitoring»

to

«Predictive Engine Intelligence»

By combining real-time telemetry, machine learning, Digital Twin concepts, prognostics and mission analysis, AERONEX is designed to provide a unified view of engine health, fault behavior, degradation, RUL and mission reliability.

---

✈️ AERONEX

Observe → Detect → Diagnose → Predict → Decide

Team AETHERIS_GAT | Smart India Hackathon 2026 | Team No. 149433
