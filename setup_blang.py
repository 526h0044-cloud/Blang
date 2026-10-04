#!/usr/bin/env python3
"""
================================================================================
BLang Runtime Environment & Toolchain Automated Installer (setup_blang.py)
================================================================================
Automates the local installation of the BLang runtime environment and sets up the
'blang' command-line interface (CLI) executable on your system.

Usage:
    python3 setup_blang.py             # Install BLang locally into ~/.blang
    python3 setup_blang.py --check     # Check Python dependencies and environment
    python3 setup_blang.py --uninstall # Cleanly remove BLang installation
    python3 setup_blang.py --prefix /custom/path # Install to custom directory

Target Platforms:
    - Linux (Ubuntu, Debian, Fedora, Arch, CentOS)
    - macOS (Intel & Apple Silicon M1/M2/M3/M4)
    - Windows 10/11 (PowerShell / Command Prompt / Git Bash)
================================================================================
"""

import sys
import os
import shutil
import stat
import json
import subprocess
import argparse
from pathlib import Path

BLANG_VERSION = "1.0.0"
REQUIRED_PYTHON_MAJOR = 3
REQUIRED_PYTHON_MINOR = 8

# Terminal ANSI colors
GREEN = "\033[92m"
BLUE = "\033[94m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_banner():
    banner = f"""{CYAN}{BOLD}
    ==================================================================
           ____  __                     ____             _   _            
          |  _ \|  |    ____ _ _ __   / ___|  ___| |_ _   _ _ __      
          | |_) |  |   / _` | '_ \ | |  _  / _ \ __| | | | '_ \     
          |  _ <|  |__| (_| | | | | | |_| |  __/ |_| |_| | |_) |    
          |_| \_\_____|\__,_|_| |_|  \____| \___|\__|\__,_| .__/     
                                                           |_|        
             BLang Language Runtime & Compiler Toolchain v{BLANG_VERSION}
    =================================================================={RESET}
    """
    print(banner)

def log_info(msg: str):
    print(f"{BLUE}[INFO]{RESET} {msg}")

def log_success(msg: str):
    print(f"{GREEN}[SUCCESS]{RESET} {msg}")

def log_warn(msg: str):
    print(f"{YELLOW}[WARN]{RESET} {msg}")

def log_error(msg: str):
    print(f"{RED}[ERROR]{RESET} {msg}")

def check_python_environment() -> bool:
    """Verifies that the Python environment meets all requirements for BLang."""
    log_info(f"Checking Python version... Detected: Python {sys.version.split()[0]}")
    if sys.version_info < (REQUIRED_PYTHON_MAJOR, REQUIRED_PYTHON_MINOR):
        log_error(
            f"BLang requires Python {REQUIRED_PYTHON_MAJOR}.{REQUIRED_PYTHON_MINOR} or newer. "
            f"Current version is {sys.version.split()[0]}. Please upgrade Python."
        )
        return False
    
    log_info("Checking standard modules...")
    required_modules = [
        "math", "re", "json", "time", "dataclasses", "typing",
        "shutil", "argparse", "pathlib", "subprocess"
    ]
    for mod in required_modules:
        try:
            __import__(mod)
        except ImportError:
            log_error(f"Missing required standard library module: '{mod}'")
            return False

    # Optional readline for enhanced REPL history
    if sys.platform != "win32":
        try:
            import readline
            log_info("  + 'readline' module available (interactive REPL history enabled)")
        except ImportError:
            log_warn("  - 'readline' module not found (REPL will run with standard input)")

    log_success("All environment and Python dependency checks passed successfully!")
    return True

# Template for the 'blang' CLI executable
UNIX_CLI_TEMPLATE = """#!/usr/bin/env python3
# ==============================================================================
# BLang Language CLI Wrapper
# Native independent programming language toolchain
# ==============================================================================
import sys
import os

BLANG_HOME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB_DIR = os.path.join(BLANG_HOME, "lib")
COMPILER_PATH = os.path.join(LIB_DIR, "compiler.py")

if not os.path.exists(COMPILER_PATH):
    print(f"[Error] BLang compiler engine missing at {COMPILER_PATH}")
    sys.exit(1)

sys.path.insert(0, LIB_DIR)

# Normalize args: allow 'blang script.bl' as shorthand for 'blang run script.bl'
args = sys.argv[1:]
if args and not args[0].startswith("-") and args[0] not in ("run", "repl", "transpile", "test", "build", "dis", "export"):
    if args[0].endswith(".bl") or os.path.exists(args[0]):
        args = ["run"] + args

sys.argv = [COMPILER_PATH] + args
from compiler import main

if __name__ == "__main__":
    main()
"""

WINDOWS_CMD_TEMPLATE = """@echo off
rem ==============================================================================
rem BLang Language CLI Wrapper for Windows CMD / PowerShell
rem ==============================================================================
set BLANG_HOME=%~dp0..
python "%BLANG_HOME%\\lib\\compiler.py" run %*
"""

WINDOWS_PS1_TEMPLATE = """# ==============================================================================
# BLang Language CLI Wrapper for PowerShell
# ==============================================================================
$BlangHome = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$argsList = $args
if ($argsList.Count -gt 0 -and $argsList[0] -notmatch "^-" -and $argsList[0] -notin @("run", "repl", "transpile", "test")) {
    if ($argsList[0].EndsWith(".bl")) {
        $argsList = @("run") + $argsList
    }
}
python "$BlangHome\\lib\\compiler.py" $argsList
"""

def install_blang(install_dir: Path) -> bool:
    """Installs BLang files into the designated directory and configures executable."""
    bin_dir = install_dir / "bin"
    lib_dir = install_dir / "lib"
    examples_dir = install_dir / "examples"

    log_info(f"Target installation directory: {install_dir}")

    # Create directories
    for d in (bin_dir, lib_dir, examples_dir):
        d.mkdir(parents=True, exist_ok=True)

    # 1. Copy or install compiler.py
    current_dir = Path(__file__).resolve().parent
    local_compiler = current_dir / "compiler.py"

    if local_compiler.exists():
        log_info(f"Copying compiler engine from {local_compiler}...")
        shutil.copy2(local_compiler, lib_dir / "compiler.py")
    else:
        log_error("Could not find 'compiler.py' in the current setup directory.")
        return False

    # 2. Write metadata
    metadata = {
        "name": "BLang Programming Language",
        "version": BLANG_VERSION,
        "installed_at": str(install_dir),
        "python_interpreter": sys.executable,
    }
    with open(lib_dir / "blang_meta.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 3. Create the 'blang' CLI executable
    blang_exec = bin_dir / "blang"
    with open(blang_exec, "w", encoding="utf-8") as f:
        f.write(UNIX_CLI_TEMPLATE)

    # Make executable on Unix
    if sys.platform != "win32":
        current_permissions = blang_exec.stat().st_mode
        blang_exec.chmod(current_permissions | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH | stat.S_IRUSR | stat.S_IWUSR)

    # Also create Windows scripts
    with open(bin_dir / "blang.cmd", "w", encoding="utf-8") as f:
        f.write(WINDOWS_CMD_TEMPLATE)
    with open(bin_dir / "blang.bat", "w", encoding="utf-8") as f:
        f.write(WINDOWS_CMD_TEMPLATE)
    with open(bin_dir / "blang.ps1", "w", encoding="utf-8") as f:
        f.write(WINDOWS_PS1_TEMPLATE)

    log_success(f"Created 'blang' CLI binary in {bin_dir}")

    # 4. Copy sample files
    sample_files = ["main.bl", "geometry_math.bl", "math_lib.bl"]
    for sf in sample_files:
        src = current_dir / sf
        if src.exists():
            shutil.copy2(src, examples_dir / sf)
    log_info(f"Installed sample programs into {examples_dir}")

    # 5. Symlink to user PATH if possible (~/.local/bin)
    if sys.platform != "win32":
        user_local_bin = Path.home() / ".local" / "bin"
        if user_local_bin.exists():
            target_link = user_local_bin / "blang"
            try:
                if target_link.exists() or target_link.is_symlink():
                    target_link.unlink()
                target_link.symlink_to(blang_exec)
                log_success(f"Symlinked 'blang' executable into {user_local_bin} for immediate access!")
            except Exception as e:
                log_warn(f"Could not create symlink in ~/.local/bin: {e}")

    # 6. Verify installation by running a sample script
    test_script_path = install_dir / "test_verification.bl"
    test_code = """// BLang installation self-test
$message = "BLang Native Engine is 100% operational!";
@circle_area_test = cir_s(5);
print(">>>", $message);
print(">>> Verified Circle Area (r=5):", @circle_area_test);
"""
    with open(test_script_path, "w", encoding="utf-8") as f:
        f.write(test_code)

    log_info("Running self-test execution with newly installed compiler...")
    try:
        run_cmd = [sys.executable, str(lib_dir / "compiler.py"), "run", str(test_script_path)]
        proc = subprocess.run(run_cmd, capture_output=True, text=True, check=True)
        for line in proc.stdout.splitlines():
            print(f"    {GREEN}{line}{RESET}")
        log_success("Self-test executed successfully with zero runtime diagnostics!")
    except subprocess.CalledProcessError as e:
        log_error(f"Self-test failed:\n{e.stderr}")
        return False
    finally:
        if test_script_path.exists():
            test_script_path.unlink()

    # 7. Print Path instructions
    print_path_instructions(bin_dir)
    return True

def print_path_instructions(bin_dir: Path):
    path_env = os.environ.get("PATH", "")
    bin_str = str(bin_dir)

    print("\n" + "=" * 70)
    if bin_str in path_env:
        log_success(f"'{bin_dir}' is ALREADY in your system PATH!")
        print(f"You can now run {BOLD}blang --help{RESET} or {BOLD}blang <file.bl>{RESET} from any terminal.")
    else:
        log_warn(f"'{bin_dir}' is NOT yet in your system PATH.")
        print("To run 'blang' directly from any folder, add it to your PATH:\n")
        if sys.platform == "darwin" or "linux" in sys.platform:
            print(f"  {CYAN}echo 'export PATH=\"{bin_dir}:$PATH\"' >> ~/.bashrc{RESET}")
            print(f"  {CYAN}echo 'export PATH=\"{bin_dir}:$PATH\"' >> ~/.zshrc{RESET}")
            print(f"  {CYAN}source ~/.bashrc{RESET}  (or restart your terminal)")
        else:
            print(f"  {CYAN}[Environment]::SetEnvironmentVariable(\"Path\", $env:Path + \";{bin_dir}\", \"User\"){RESET}")
    print("=" * 70 + "\n")

def uninstall_blang(install_dir: Path):
    """Cleanly removes BLang installation."""
    log_info(f"Removing BLang installation from {install_dir}...")
    if install_dir.exists():
        shutil.rmtree(install_dir)
        log_success("BLang installation directory removed.")
    else:
        log_info("BLang installation directory does not exist.")

    # Remove symlink if exists
    if sys.platform != "win32":
        symlink = Path.home() / ".local" / "bin" / "blang"
        if symlink.exists() or symlink.is_symlink():
            symlink.unlink()
            log_success(f"Removed symlink {symlink}")

    log_success("BLang has been cleanly uninstalled from your machine.")

def main():
    parser = argparse.ArgumentParser(description="BLang Language Runtime & CLI Installer")
    parser.add_argument("--check", action="store_true", help="Check system Python and dependencies without installing")
    parser.add_argument("--uninstall", action="store_true", help="Uninstall BLang from the local machine")
    parser.add_argument(
        "--prefix",
        type=str,
        default=str(Path.home() / ".blang"),
        help="Installation directory prefix (default: ~/.blang)"
    )

    args = parser.parse_args()
    print_banner()

    install_path = Path(args.prefix).resolve()

    if args.check:
        ok = check_python_environment()
        sys.exit(0 if ok else 1)

    if args.uninstall:
        uninstall_blang(install_path)
        sys.exit(0)

    # Full installation flow
    if not check_python_environment():
        sys.exit(1)

    success = install_blang(install_path)
    if success:
        print(f"{GREEN}{BOLD}>>> Installation of BLang Language Runtime complete!{RESET}\n")
        print("Quick Command Cheat Sheet:")
        print(f"  {BOLD}blang run main.bl{RESET}       : Run code directly")
        print(f"  {BOLD}blang build main.bl{RESET}     : Compile to native .blc bytecode")
        print(f"  {BOLD}blang dis main.bl{RESET}       : Disassemble into BVM instructions")
        print(f"  {BOLD}blang export main.bl{RESET}    : Transpile to Python and JavaScript")
        print(f"  {BOLD}blang repl{RESET}              : Open interactive BLang terminal")
        print(f"  {BOLD}blang --version{RESET}         : Check installed version\n")
    else:
        log_error("Installation encountered errors. Please check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
