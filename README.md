✈️ AERONEX — AI-Enabled Digital Twin for Aero Piston Engines

«Smart India Hackathon 2026 | Team AETHERIS | Team ID: GAT001»

AERONEX is an AI-enabled real-time Digital Twin system designed for health monitoring, fault prediction, Remaining Useful Life (RUL) estimation, and mission reliability enhancement of aero piston engines used in MALE UAVs.

The system combines real-time telemetry, Digital Twin technology, Machine Learning, anomaly detection, prognostics, and mission simulation into a unified decision-support platform.

---

🚀 Problem Statement

Aero piston engines used in UAVs operate under continuously changing conditions such as:

- RPM
- Manifold/ambient pressure
- Oil pressure and temperature
- Cylinder Head Temperature (CHT)
- Exhaust Gas Temperature (EGT)
- Fuel flow
- Vibration
- Throttle
- Engine load
- Altitude

Traditional monitoring systems primarily show current sensor values. They may not provide sufficient early warning of degradation or impending faults.

AERONEX addresses this by transforming raw telemetry into health insights, fault predictions, degradation trends, RUL estimates, and mission-level decisions.

---

💡 Our Solution

AERONEX follows an end-to-end pipeline:

Telemetry
    ↓
Data Validation & Preprocessing
    ↓
Digital Twin
    ↓
ML-Based Health Analysis
    ↓
Anomaly / Fault Detection
    ↓
Degradation & Prognostics
    ↓
RUL Estimation
    ↓
Mission Simulation
    ↓
Decision Support
    ↓
Interactive Dashboard

The goal is to move from:

"What is happening to the engine?"

to

"What is likely to happen next, and what should we consider doing?"

---

⭐ Key Features

📡 Real-Time Telemetry Monitoring

Monitors important engine and environmental parameters and provides a centralized view of engine health.

🪞 Digital Twin

Creates a software representation of the physical engine that continuously reflects its operational state using telemetry data.

🤖 Machine Learning-Based Analysis

Machine learning models analyze telemetry patterns to identify abnormal engine behavior and support fault prediction.

🚨 Anomaly & Fault Detection

Detects deviations from expected operating behavior and identifies potential fault conditions.

Supported fault categories include:

- Lubrication faults
- Cooling faults
- Bearing-related faults
- Overheating
- Performance degradation
- Sensor-related faults

📉 Degradation Monitoring

Tracks changes in engine health over time instead of relying only on instantaneous sensor values.

⏳ Remaining Useful Life (RUL)

Estimates the remaining operational life of the engine based on its degradation behavior.

🛫 Mission Simulation

Evaluates engine behavior under different mission conditions and helps analyze potential operational scenarios.

🧠 Decision Support

Combines health, fault, degradation, and mission information to provide actionable engineering insights.

📊 Interactive Dashboard

Provides visualizations for:

- Live telemetry
- Engine health
- Fault status
- Anomalies
- Degradation
- RUL
- Mission analysis
- Alerts

---

🧠 Machine Learning Pipeline

AERONEX uses machine learning as part of the predictive maintenance pipeline.

Engine Telemetry
      ↓
Data Cleaning
      ↓
Feature Preparation
      ↓
Pattern Analysis
      ↓
Anomaly / Fault Detection
      ↓
Health Assessment
      ↓
Degradation Analysis
      ↓
RUL Estimation

The ML layer is designed to help identify patterns that may not be obvious from individual sensor readings.

---

🏗️ System Architecture

             ┌─────────────────────┐
             │   Engine Telemetry  │
             └──────────┬──────────┘
                        ↓
             ┌─────────────────────┐
             │ Data Processing &   │
             │ Validation          │
             └──────────┬──────────┘
                        ↓
             ┌─────────────────────┐
             │    Digital Twin     │
             └──────────┬──────────┘
                        ↓
          ┌─────────────┴─────────────┐
          ↓                           ↓
 ┌─────────────────┐        ┌─────────────────┐
 │ ML / Anomaly    │        │ Engine Health   │
 │ Detection       │        │ Analysis        │
 └────────┬────────┘        └────────┬────────┘
          ↓                           ↓
 ┌─────────────────┐        ┌─────────────────┐
 │ Prognostics &   │        │ Mission         │
 │ RUL Estimation  │        │ Simulation      │
 └────────┬────────┘        └────────┬────────┘
          └─────────────┬─────────────┘
                        ↓
             ┌─────────────────────┐
             │ Decision Support    │
             └──────────┬──────────┘
                        ↓
             ┌─────────────────────┐
             │ Web Dashboard       │
             └─────────────────────┘

---

🛠️ Technology Stack

Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL / Supabase
- WebSockets
- Uvicorn

Machine Learning

- Python
- Scikit-learn
- Pandas
- NumPy
- Machine-learning-based anomaly and health analysis
- Time-series telemetry analysis

Frontend

- React
- Vite
- TypeScript
- Interactive data visualization

Database

- PostgreSQL
- Supabase
- Structured telemetry and engine-related data storage

Development & Deployment

- Git & GitHub
- Docker
- REST APIs
- WebSocket-based real-time communication

---

📊 Telemetry Parameters

AERONEX works with telemetry such as:

Parameter| Purpose
RPM| Engine rotational speed
MAP| Manifold pressure
Oil Pressure| Lubrication-system monitoring
Oil Temperature| Lubrication/thermal monitoring
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

🔄 Backend Data Flow

The backend acts as the communication layer between the frontend, database, and intelligence modules.

Frontend
   │
   │ HTTP / WebSocket
   ↓
FastAPI Backend
   │
   ├── Telemetry API
   ├── Engine Health API
   ├── Alerts API
   ├── Analysis API
   ├── Prognostics / RUL API
   └── Mission API
   │
   ↓
Database
   │
   ↓
ML + Digital Twin + Simulation
   │
   ↓
Processed Results
   │
   ↓
Frontend Dashboard

---

🔌 API Layer

AERONEX exposes backend functionality through REST APIs and real-time communication.

Example telemetry endpoint:

POST /api/telemetry

This endpoint receives structured telemetry data, validates it using Pydantic, processes the request through the backend, and stores/forwards the relevant information for downstream analysis.

The API documentation is automatically available through FastAPI's OpenAPI interface.

/docs
/openapi.json

---

🗄️ Data Model

Telemetry is represented using structured fields such as:

timestamp
engine_id
mission_id
rpm
manifold_pressure
oil_pressure
oil_temperature
cht
egt
fuel_flow
vibration
ambient_temperature
ambient_pressure
altitude
throttle
engine_load
fault_label
fault_severity
health_state

This standardized data contract allows the simulation, backend, database, ML pipeline, and frontend to communicate using a consistent structure.

---

🎯 Why AERONEX?

AERONEX brings multiple capabilities into a single platform:

Real-Time Monitoring + Digital Twin + AI + Prognostics + RUL + Mission Simulation + Decision Support

Instead of simply displaying sensor values, the platform aims to provide a deeper understanding of:

- Current engine condition
- Abnormal behavior
- Potential fault conditions
- Degradation trends
- Remaining useful life
- Mission-level implications

---

🌍 Potential Impact

AERONEX can support UAV operators and maintenance teams by enabling:

- Early identification of abnormal engine behavior
- Predictive maintenance planning
- Reduced unexpected engine failures
- Improved engine utilization
- Better mission preparation
- Data-driven maintenance decisions
- Improved operational reliability

---

🔮 Future Scope

Potential future enhancements include:

- Integration with real UAV engine telemetry
- Edge deployment for onboard inference
- More advanced time-series forecasting models
- Physics-informed Digital Twin models
- Explainable AI for model decisions
- Automated maintenance recommendations
- Multi-engine fleet monitoring
- Historical health trend analysis
- Integration with real-world avionics/IoT telemetry systems

---

👥 Team AETHERIS

Smart India Hackathon 2026

Member| Contribution
Vidya M| Backend, ML & System Integration
Srushti| Backend & ML
Sab| Backend & ML
Krutin Bhat| Database
Samarth| Simulation
Deekshith| UI & Presentation

Team ID: "GAT001"

---

📌 Project Status

🚧 Active Development

The current version demonstrates the integrated AERONEX workflow using simulated engine telemetry and AI-driven analysis.

The architecture is designed to support future integration with real engine telemetry sources.

---

📜 License

This project was developed as part of Smart India Hackathon 2026 by Team AETHERIS.

---

<p align="center">✈️ AERONEX

Turning Engine Data into Predictive Intelligence

</p>
