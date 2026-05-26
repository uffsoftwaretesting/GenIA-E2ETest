"""Generic sandboxed test execution for generated scripts."""

from __future__ import annotations

import os
import glob
import re
import shutil
import subprocess
import tempfile
import time
import traceback
import uuid
import sys
from textwrap import dedent
from pathlib import Path
from typing import Callable, Optional

from backend.domain.models import ExecutionResult


LogCallback = Callable[[str, str], None]


class TestExecutor:
    def _python_command(self) -> str:
        return sys.executable or "python"

    def _is_unix_like(self) -> bool:
        return os.name != "nt"

    def _emit(self, callback: Optional[LogCallback], level: str, message: str) -> None:
        if callback:
            callback(level, message)

    def _write_file(self, directory: str, filename: str, content: str) -> str:
        file_path = os.path.join(directory, filename)
        Path(file_path).write_text(content, encoding="utf-8")
        return file_path

    def _collect_artifacts(self, directory: str) -> list[str]:
        collected: list[str] = []
        artifact_extensions = {".png", ".jpg", ".jpeg", ".webp", ".webm", ".mp4", ".zip", ".trace", ".html", ".xml", ".json", ".log"}

        for root, _, files in os.walk(directory):
            for file_name in files:
                file_path = os.path.join(root, file_name)
                if Path(file_path).suffix.lower() in artifact_extensions:
                    collected.append(file_path)
        return collected

    def _stream_process(
        self,
        process: subprocess.Popen[str],
        execution_log_lines: list[str],
        callback: Optional[LogCallback] = None,
    ) -> tuple[str, str]:
        stdout_lines: list[str] = []
        stderr_lines: list[str] = []

        def drain(stream, prefix: str, store: list[str], level: str) -> None:
            if not stream:
                return
            while True:
                line = stream.readline()
                if not line:
                    break
                clean = line.rstrip("\n")
                store.append(clean)
                execution_log_lines.append(f"[{prefix}] {clean}")
                self._emit(callback, level, clean)

        while True:
            drained_any = False
            if process.stdout:
                line = process.stdout.readline()
                if line:
                    drained_any = True
                    clean = line.rstrip("\n")
                    stdout_lines.append(clean)
                    execution_log_lines.append(f"[STDOUT] {clean}")
                    self._emit(callback, "info", clean)

            if process.stderr:
                line = process.stderr.readline()
                if line:
                    drained_any = True
                    clean = line.rstrip("\n")
                    stderr_lines.append(clean)
                    execution_log_lines.append(f"[STDERR] {clean}")
                    self._emit(callback, "error", clean)

            if not drained_any and process.poll() is not None:
                break

        drain(process.stdout, "STDOUT", stdout_lines, "info")
        drain(process.stderr, "STDERR", stderr_lines, "error")

        return "\n".join(stdout_lines), "\n".join(stderr_lines)

    def _build_command(self, framework: str, script_path: str, language: str | None = None) -> list[str]:
        framework = framework.lower()
        language = (language or "").lower()
        python_cmd = self._python_command()

        if framework in {"pytest", "selenium"} and script_path.endswith(".py"):
            return [python_cmd, "-m", "pytest", script_path, "-q"]
        if framework == "robotframework":
            robot_command = [python_cmd, "-m", "robot", script_path]
            if self._is_unix_like() and shutil.which("xvfb-run"):
                return ["xvfb-run", "-a", *robot_command]
            return robot_command
        if framework == "selenium":
            if language == "python" or script_path.endswith(".py"):
                return [python_cmd, script_path]
            if language in {"javascript", "typescript"} or script_path.endswith((".js", ".ts")):
                return ["node", script_path]
            if language == "java":
                return ["javac", script_path]
        if framework in {"playwright"} and script_path.endswith((".js", ".ts")):
            if shutil.which("npx"):
                return ["npx", "playwright", "test", script_path]
            return ["node", script_path]
        if framework == "cypress":
            if shutil.which("npx"):
                return ["npx", "cypress", "run", "--spec", script_path]
            return ["node", script_path]
        if framework == "junit":
            if shutil.which("mvn"):
                return ["mvn", "-q", "-Dtest=GeneratedTest", "test"]
            if shutil.which("javac"):
                return ["javac", script_path]
        if framework == "python":
            return [python_cmd, script_path]

        return [python_cmd, script_path]

    def _determine_filename(self, framework: str, script: str, language: str | None = None) -> str:
        framework = framework.lower()
        language = (language or "").lower()
        if framework == "robotframework":
            return f"test_{uuid.uuid4().hex}.robot"
        if framework in {"playwright", "cypress"}:
            return f"test_{uuid.uuid4().hex}.js"
        if framework == "selenium":
            if language == "python" or "def test_" in script:
                return f"test_{uuid.uuid4().hex}.py"
            if language in {"javascript", "typescript"} or "import { test" in script or "describe(" in script:
                return f"test_{uuid.uuid4().hex}.js"
            if language == "java":
                return "GeneratedTest.java"
        if framework == "junit":
            return "GeneratedTest.java"
        return f"test_{uuid.uuid4().hex}.py"

    def _write_robot_listener(self, directory: str) -> str:
        listener_source = dedent(
            """
            ROBOT_LISTENER_API_VERSION = 3

            def end_test(data, result):
                if getattr(result, "status", "") != "FAIL":
                    return
                try:
                    from robot.libraries.BuiltIn import BuiltIn
                    built_in = BuiltIn()
                    try:
                        built_in.run_keyword("Capture Page Screenshot")
                    except Exception:
                        built_in.run_keyword("Capture Screenshot")
                except Exception:
                    pass
            """
        ).strip()
        listener_path = os.path.join(directory, "genia_failure_listener.py")
        Path(listener_path).write_text(listener_source, encoding="utf-8")
        return listener_path

    def _discover_chrome_binary(self) -> str | None:
        candidates = []
        candidates.extend(glob.glob("/ms-playwright/chromium-*/chrome-linux64/chrome"))
        candidates.extend(glob.glob("/ms-playwright/chromium-*/chrome-linux/chrome"))
        candidates.extend(glob.glob("/usr/bin/google-chrome"))
        candidates.extend(glob.glob("/usr/bin/chromium"))
        candidates.extend(glob.glob("/usr/bin/chromium-browser"))
        for candidate in candidates:
            if candidate and os.path.exists(candidate):
                return candidate
        return None

    def _normalize_robot_script(self, script: str) -> str:
        normalized = script.replace("\r\n", "\n")
        normalized = re.sub(
            r"(?m)^(\s*\$\{chrome_bin\}\s+)\$\{CHROME_BIN\}\s*$",
            r"\1%{CHROME_BIN}",
            normalized,
        )
        normalized = re.sub(
            r"(?m)^(\s*Run Keyword If\s+'\\$\\{chrome_bin\\}' != ''\s+Set Suite Variable\s+)\$\{chrome_options\.binary_location\}\s+\$\{chrome_bin\}\s*$",
            r"\1Evaluate    setattr($chrome_options, 'binary_location', $chrome_bin)",
            normalized,
        )
        normalized = re.sub(
            r"(?m)^(\s*Set Suite Variable\s+)\$\{chrome_options\.binary_location\}\s+\$\{chrome_bin\}\s*$",
            r"\1Evaluate    setattr($chrome_options, 'binary_location', $chrome_bin)",
            normalized,
        )

        return normalized

    def execute(
        self,
        framework: str,
        script: str,
        language: str | None = None,
        log_callback: Optional[LogCallback] = None,
    ) -> ExecutionResult:
        start = time.time()
        execution_log_lines: list[str] = []
        temp_dir = tempfile.mkdtemp(prefix="genia-exec-")

        try:
            filename = self._determine_filename(framework, script, language)
            if framework.lower() == "robotframework":
                script = self._normalize_robot_script(script)
            file_path = self._write_file(temp_dir, filename, script)
            execution_log_lines.append(f"[SETUP] Workspace: {temp_dir}")
            execution_log_lines.append(f"[SETUP] Script file: {file_path}")
            self._emit(log_callback, "info", f"Script preparado em {file_path}")

            command = self._build_command(framework, file_path, language)
            if framework.lower() == "junit" and command[:1] == ["mvn"]:
                execution_log_lines.append("[EXECUTION] Maven detected, but no project scaffold was generated")
                raise RuntimeError("JUnit execution requires a Maven or Gradle project scaffold.")

            if framework.lower() == "robotframework":
                listener_path = self._write_robot_listener(temp_dir)
                python_cmd = self._python_command()
                robot_command = [python_cmd, "-m", "robot", "--listener", listener_path, file_path]
                if self._is_unix_like() and shutil.which("xvfb-run"):
                    command = ["xvfb-run", "-a", *robot_command]
                else:
                    command = robot_command

            execution_log_lines.append(f"[EXECUTION] Command: {' '.join(command)}")
            self._emit(log_callback, "info", f"Executando {' '.join(command)}")

            env = os.environ.copy()
            env.setdefault("DISPLAY", env.get("DISPLAY", ":99"))
            chrome_binary = self._discover_chrome_binary()
            if chrome_binary:
                env.setdefault("CHROME_BIN", chrome_binary)

            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=temp_dir,
                env=env,
            )

            stdout_text, stderr_text = self._stream_process(process, execution_log_lines, log_callback)
            return_code = process.wait(timeout=600)

            artifacts = self._collect_artifacts(temp_dir)
            screenshots = [path for path in artifacts if Path(path).suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}]
            traces = [path for path in artifacts if Path(path).suffix.lower() == ".trace"]
            evidence = [path for path in artifacts if Path(path).suffix.lower() in {".html", ".xml", ".json", ".log", ".zip", ".mp4", ".webm"}]
            is_passed = return_code == 0

            execution_log_lines.append(f"[RESULT] Process exit code: {return_code}")
            execution_log_lines.append(f"[RESULT] Status: {'PASSED' if is_passed else 'FAILED'}")
            self._emit(log_callback, "success" if is_passed else "error", f"Execução finalizada com status {'PASSED' if is_passed else 'FAILED'}")

            return ExecutionResult(
                stdout=stdout_text,
                stderr=stderr_text,
                status="passed" if is_passed else "failed",
                duration=time.time() - start,
                screenshots=screenshots,
                traces=traces,
                logs=evidence,
                evidence=evidence,
                execution_log_lines=execution_log_lines,
                stacktrace=stderr_text if not is_passed else None,
                test_results={
                    "exit_code": return_code,
                    "artifacts_count": len(artifacts),
                    "duration_seconds": round(time.time() - start, 2),
                    "framework": framework,
                    "language": language,
                },
                framework=framework,
                runtime=" ".join(command[:2]) if command else None,
            )

        except subprocess.TimeoutExpired:
            execution_log_lines.append("[ERROR] Execution timeout (limit exceeded)")
            self._emit(log_callback, "error", "Execução excedeu o tempo limite")
            return ExecutionResult(
                stdout="",
                stderr="Execution timeout",
                status="error",
                duration=time.time() - start,
                execution_log_lines=execution_log_lines,
                stacktrace=traceback.format_exc(),
                framework=framework,
                runtime=framework,
            )
        except Exception as exc:
            execution_log_lines.append(f"[ERROR] {exc}")
            self._emit(log_callback, "error", str(exc))
            return ExecutionResult(
                stdout="",
                stderr=str(exc),
                status="error",
                duration=time.time() - start,
                execution_log_lines=execution_log_lines,
                stacktrace=traceback.format_exc(),
                framework=framework,
                runtime=framework,
            )
