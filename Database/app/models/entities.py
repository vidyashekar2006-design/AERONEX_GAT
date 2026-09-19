"""Normalized, engine-centric AERONEX persistence models."""
from datetime import datetime
from typing import Any
from uuid import UUID
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.enums import (AnalysisType, DataQuality, DegradationScenario, EventSeverity, EventStatus, HealthStatus, OperatingMode, ReliabilityStatus)
from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

def enum_type(enum: type):
    return Enum(enum, native_enum=False, create_constraint=True)

class Engine(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "engines"
    engine_identifier: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    engine_model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)
    missions: Mapped[list["MissionRun"]] = relationship(back_populates="engine")

class MissionRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "mission_runs"
    mission_identifier: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    mission_name: Mapped[str | None] = mapped_column(String(200))
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(50), default="PLANNED")
    mission_profile: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    source: Mapped[str] = mapped_column(String(50), default="BACKEND_DERIVED")
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)
    engine: Mapped[Engine] = relationship(back_populates="missions")
    phases: Mapped[list["MissionPhase"]] = relationship(back_populates="mission_run")

class MissionPhase(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "mission_phases"
    mission_run_id: Mapped[UUID] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"), index=True)
    phase_name: Mapped[str] = mapped_column(String(50))
    phase_index: Mapped[int] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    progress_start: Mapped[float | None] = mapped_column(Float)
    progress_end: Mapped[float | None] = mapped_column(Float)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)
    mission_run: Mapped[MissionRun] = relationship(back_populates="phases")
    __table_args__ = (UniqueConstraint("mission_run_id", "phase_index"),)

class Telemetry(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "telemetry"
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), nullable=False)
    mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sim_time: Mapped[float] = mapped_column(Float, nullable=False)
    rpm: Mapped[float] = mapped_column(Float); cht: Mapped[float] = mapped_column(Float); egt: Mapped[float] = mapped_column(Float)
    oil_temperature: Mapped[float] = mapped_column(Float); oil_pressure: Mapped[float] = mapped_column(Float); fuel_flow: Mapped[float] = mapped_column(Float); vibration: Mapped[float] = mapped_column(Float)
    throttle: Mapped[float] = mapped_column(Float); altitude: Mapped[float] = mapped_column(Float); ambient_temperature: Mapped[float] = mapped_column(Float)
    operating_mode: Mapped[OperatingMode] = mapped_column(enum_type(OperatingMode))
    degradation_scenario: Mapped[DegradationScenario] = mapped_column(enum_type(DegradationScenario), default=DegradationScenario.NORMAL)
    degradation_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    degradation_severity: Mapped[float] = mapped_column(Float, default=0.0)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    packet_id: Mapped[str | None] = mapped_column(String(100))
    sequence_number: Mapped[int | None] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    quality: Mapped[DataQuality] = mapped_column(enum_type(DataQuality), default=DataQuality.VALID)
    quality_reason: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (Index("ix_telemetry_engine_timestamp", "engine_id", "timestamp"), Index("ix_telemetry_mission_timestamp", "mission_run_id", "timestamp"), Index("ix_telemetry_engine_sim_time", "engine_id", "sim_time"), UniqueConstraint("engine_id", "packet_id", name="uq_telemetry_engine_packet"), UniqueConstraint("engine_id", "mission_run_id", "sequence_number", name="uq_telemetry_engine_mission_sequence"))

class ProcessedTelemetry(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "processed_telemetry"
    telemetry_id: Mapped[UUID] = mapped_column(ForeignKey("telemetry.id", ondelete="RESTRICT"), unique=True)
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), index=True)
    mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    values: Mapped[dict[str, Any]] = mapped_column(JSON)
    processing_version: Mapped[str] = mapped_column(String(100))
    source: Mapped[str] = mapped_column(String(50))

class EngineFeature(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "engine_features"
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), index=True)
    mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    feature_name: Mapped[str] = mapped_column(String(100)); feature_value: Mapped[float] = mapped_column(Float); feature_unit: Mapped[str | None] = mapped_column(String(30))
    window_size: Mapped[float | None] = mapped_column(Float); feature_version: Mapped[str] = mapped_column(String(100)); processing_version: Mapped[str | None] = mapped_column(String(100)); source: Mapped[str] = mapped_column(String(50)); metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)

class StateBase(UUIDPrimaryKeyMixin, Base):
    __abstract__ = True
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), index=True)
    mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)

class DigitalTwinState(StateBase):
    __tablename__ = "digital_twin_states"
    operating_mode: Mapped[OperatingMode] = mapped_column(enum_type(OperatingMode)); rpm: Mapped[float | None] = mapped_column(Float); throttle: Mapped[float | None] = mapped_column(Float); altitude: Mapped[float | None] = mapped_column(Float); ambient_temperature: Mapped[float | None] = mapped_column(Float)
    degradation_scenario: Mapped[DegradationScenario | None] = mapped_column(enum_type(DegradationScenario)); degradation_enabled: Mapped[bool | None] = mapped_column(Boolean); degradation_severity: Mapped[float | None] = mapped_column(Float); state_status: Mapped[str] = mapped_column(String(50), default="NOT_AVAILABLE"); metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)

class EngineHealthState(StateBase):
    __tablename__ = "engine_health_states"
    status: Mapped[HealthStatus] = mapped_column(enum_type(HealthStatus), default=HealthStatus.NOT_AVAILABLE); score: Mapped[float | None] = mapped_column(Float); confidence: Mapped[float | None] = mapped_column(Float); method: Mapped[str | None] = mapped_column(String(100)); model_name: Mapped[str | None] = mapped_column(String(100)); model_version: Mapped[str | None] = mapped_column(String(100)); reason: Mapped[str | None] = mapped_column(Text)

class HealthEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "health_events"
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), index=True); mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"), index=True); timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    type: Mapped[str] = mapped_column(String(100)); severity: Mapped[EventSeverity] = mapped_column(enum_type(EventSeverity)); message: Mapped[str] = mapped_column(Text); status: Mapped[EventStatus] = mapped_column(enum_type(EventStatus), default=EventStatus.ACTIVE); source: Mapped[str] = mapped_column(String(50)); resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True)); telemetry_id: Mapped[UUID | None] = mapped_column(ForeignKey("telemetry.id", ondelete="RESTRICT")); analysis_result_id: Mapped[UUID | None] = mapped_column(ForeignKey("analysis_results.id", ondelete="RESTRICT"))

class DegradationState(StateBase):
    __tablename__ = "degradation_states"
    scenario: Mapped[DegradationScenario] = mapped_column(enum_type(DegradationScenario)); enabled: Mapped[bool] = mapped_column(Boolean); severity: Mapped[float] = mapped_column(Float)

class AnalysisResult(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "analysis_results"
    engine_id: Mapped[UUID] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT"), index=True); mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT"), index=True); timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    analysis_type: Mapped[AnalysisType] = mapped_column(enum_type(AnalysisType)); model_name: Mapped[str | None] = mapped_column(String(100)); model_version: Mapped[str | None] = mapped_column(String(100)); status: Mapped[str] = mapped_column(String(50), default="NOT_AVAILABLE"); confidence: Mapped[float | None] = mapped_column(Float); input_window_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True)); input_window_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True)); result_data: Mapped[dict[str, Any] | None] = mapped_column(JSON); source: Mapped[str] = mapped_column(String(50))

class RULResult(StateBase):
    __tablename__ = "rul_results"
    value: Mapped[float | None] = mapped_column(Float); unit: Mapped[str | None] = mapped_column(String(30)); lower_bound: Mapped[float | None] = mapped_column(Float); upper_bound: Mapped[float | None] = mapped_column(Float); confidence: Mapped[float | None] = mapped_column(Float); model_name: Mapped[str | None] = mapped_column(String(100)); model_version: Mapped[str | None] = mapped_column(String(100)); prediction_horizon: Mapped[float | None] = mapped_column(Float)

class MissionReliability(StateBase):
    __tablename__ = "mission_reliability"
    status: Mapped[ReliabilityStatus] = mapped_column(enum_type(ReliabilityStatus), default=ReliabilityStatus.NOT_AVAILABLE); score: Mapped[float | None] = mapped_column(Float); confidence: Mapped[float | None] = mapped_column(Float); method: Mapped[str | None] = mapped_column(String(100)); model_name: Mapped[str | None] = mapped_column(String(100)); model_version: Mapped[str | None] = mapped_column(String(100)); reason: Mapped[str | None] = mapped_column(Text)

class Dataset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "datasets"
    engine_id: Mapped[UUID | None] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT")); mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT")); name: Mapped[str] = mapped_column(String(150)); version: Mapped[str] = mapped_column(String(100)); kind: Mapped[str] = mapped_column(String(30)); time_window_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True)); time_window_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True)); source: Mapped[str] = mapped_column(String(50)); metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON); __table_args__ = (UniqueConstraint("name", "version"),)

class ModelVersion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "model_versions"
    name: Mapped[str] = mapped_column(String(150)); version: Mapped[str] = mapped_column(String(100)); model_type: Mapped[str] = mapped_column(String(100)); dataset_id: Mapped[UUID | None] = mapped_column(ForeignKey("datasets.id", ondelete="RESTRICT")); artifact_reference: Mapped[str | None] = mapped_column(Text); metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON); __table_args__ = (UniqueConstraint("name", "version"),)

class Report(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reports"
    engine_id: Mapped[UUID | None] = mapped_column(ForeignKey("engines.id", ondelete="RESTRICT")); mission_run_id: Mapped[UUID | None] = mapped_column(ForeignKey("mission_runs.id", ondelete="RESTRICT")); report_type: Mapped[str] = mapped_column(String(50)); status: Mapped[str] = mapped_column(String(50)); generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True)); file_reference: Mapped[str | None] = mapped_column(Text); metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)
