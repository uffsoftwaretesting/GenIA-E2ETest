"""Domain models used across application services."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PipelineStage(str, Enum):
    STRUCTURING = "STRUCTURING"
    EXTRACTION = "EXTRACTION"
    REFINEMENT = "REFINEMENT"
    GENERATION = "GENERATION"
    VALIDATION = "VALIDATION"
    CONFIRMATION = "CONFIRMATION"
    EXECUTION = "EXECUTION"
    HOMOLOGATION = "HOMOLOGATION"
    FINALIZATION = "FINALIZATION"
    REFACTORING = "REFACTORING"


class PipelineSessionState(BaseModel):
    id: str
    state: str
    data: Dict[str, Any]
    history: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    paused_at: Optional[str] = None


class ExtractedElement(BaseModel):
    type: str = Field(..., description="HTML element type (input, button, select, etc.)")
    request_description: str = Field(..., description="What the element asks from user")
    identifier_type: str = Field(..., description="Locator method (XPath, ID, name, etc.)")
    identifier_tracking: str = Field(..., description="Exact path/selector for element")
    step_name: str = Field(..., description="Which test step uses this element")


class ExecutionStep(BaseModel):
    step: str = Field(..., description="User action or verification description")
    extracted_data: List[ExtractedElement] = Field(default_factory=list)


class Module(BaseModel):
    url: str = Field(..., description="Full URL including protocol")
    purpose: str = Field(..., description="Page role in test case")
    execution_steps: List[ExecutionStep] = Field(default_factory=list)
    extracted_data: Optional[List[ExtractedElement]] = None
    source_html: Optional[str] = None


class TestCase(BaseModel):
    testCase: str = Field(..., description="Test case name")
    modules: List[Module] = Field(default_factory=list)


class ExecutionResult(BaseModel):
    stdout: str = ""
    stderr: str = ""
    status: str
    duration: float
    screenshots: List[str] = Field(default_factory=list)
    traces: List[str] = Field(default_factory=list)
    logs: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    stacktrace: Optional[str] = None
    execution_log_lines: List[str] = Field(default_factory=list)
    test_results: Optional[Dict[str, Any]] = None
    framework: Optional[str] = None
    runtime: Optional[str] = None
