import json
import os
import signal
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cfg = json.loads((root / '.project-config.json').read_text())
env = os.environ.copy()
for group in ('env_vars', 'secrets'):
    for key, value in cfg.get(group, {}).items():
        if value:
            env[key] = str(value)
env['NODE_ENV'] = 'development'
log = open('/tmp/dental-lab-backend.log', 'w', buffering=1)
proc = subprocess.Popen(['pnpm', 'exec', 'tsx', 'server/_core/index.ts'], cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
print(proc.pid)
