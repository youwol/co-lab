import subprocess
from pathlib import Path

print("Generate TS API files")
project_folder = Path(__file__).parent
shell_command = (
    "node ./bin/index.js "
    f"--project {project_folder} "
    "--nav /doc/api/co-lab "
    f"--out {project_folder/'assets'/'api'}"
)
# Execute the shell command
subprocess.run(shell_command, shell=True, cwd="./node_modules/@youwol/mkdocs-ts",)