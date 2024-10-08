import subprocess

print("Generate TS API files")
shell_command = (
    "cd ./node_modules/@youwol/mkdocs-ts && "
    "node ./bin/index.js "
    "--project ../../../ "
    "--nav /api "
    "--out ../../../assets/api"
)
# Execute the shell command
subprocess.run(shell_command, shell=True)