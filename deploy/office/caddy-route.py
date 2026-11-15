#!/usr/bin/env python3
"""Маршрут madelarme.seoweb.kz в общем Caddy офисного сервера.

install: убирает домен из блока «Turbo-5 three static candidates» (старый охраняемый контейнер)
         и добавляет свой блок MADELARME, который ведёт на контейнер madelarme-web.
remove:  точный обратный ход, домен снова отдаёт старый контейнер.
Запуск на сервере от root под общим operation.lock:
  sudo -n flock /var/lib/server-backup/operation.lock python3 caddy-route.py install|remove
Чужие строки не трогает: каждая замена обязана совпасть ровно один раз, иначе отказ без изменений.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

CONFIG = Path('/srv/server/deployment/platform/public-ingress/Caddyfile')
EVIDENCE = Path('/srv/server/projects/madelarme/deployments')
CONTAINER = 'server-public-ingress-ingress-1'

# (как было в блоке Turbo-5, как становится)
REDIR = ('http://solidstone.seoweb.kz, http://madelarme.seoweb.kz, http://aleks-asu.seoweb.kz {\n',
         'http://solidstone.seoweb.kz, http://aleks-asu.seoweb.kz {\n')
# якорь с закрывающей скобкой соседнего блока: строка редиректа выше тоже кончается на «aleks-asu.seoweb.kz {»
SITE = ('''}

madelarme.seoweb.kz {
    route {
        import public_guard
        encode zstd gzip
        reverse_proxy 172.30.1.19:8080 {
            import visitor_headers
        }
    }
}

aleks-asu.seoweb.kz {
''', '}\n\naleks-asu.seoweb.kz {\n')
WWW = ('''
http://www.madelarme.seoweb.kz, www.madelarme.seoweb.kz {
    route {
        import public_guard
        redir https://madelarme.seoweb.kz{uri} 301
    }
}
# END Turbo-5 three static candidates
''', '# END Turbo-5 three static candidates\n')
BEGIN = '# BEGIN MADELARME managed by madelarme deployment'
END = '# END MADELARME managed by madelarme deployment'
BLOCK = '''
# BEGIN MADELARME managed by madelarme deployment
http://madelarme.seoweb.kz, http://www.madelarme.seoweb.kz {
    route {
        import public_guard
        redir https://madelarme.seoweb.kz{uri} permanent
    }
}

madelarme.seoweb.kz {
    route {
        import public_guard
        encode zstd gzip
        reverse_proxy madelarme-web:8080 {
            import visitor_headers
        }
    }
}

www.madelarme.seoweb.kz {
    route {
        import public_guard
        redir https://madelarme.seoweb.kz{uri} permanent
    }
}
# END MADELARME managed by madelarme deployment
'''


def digest(data):
    return hashlib.sha256(data).hexdigest()


def swap(text, old, new):
    if text.count(old) != 1:
        raise SystemExit('Caddyfile differs from the expected text; nothing changed: ' + old.strip().splitlines()[0])
    return text.replace(old, new, 1)


def write_existing(data):
    # Keep the inode used by Docker's single-file bind mount for signal reload.
    with CONFIG.open('r+b') as stream:
        stream.write(data)
        stream.truncate()
        stream.flush()
        os.fsync(stream.fileno())


if os.geteuid() != 0 or len(sys.argv) != 2 or sys.argv[1] not in {'install', 'remove'}:
    raise SystemExit('Use sudo flock operation.lock python3 caddy-route.py install|remove')
operation = sys.argv[1]
before = CONFIG.read_bytes()
text = before.decode()
if operation == 'install':
    if BEGIN in text or END in text or 'madelarme-web' in text:
        raise SystemExit('MADELARME block already present: inspect before changing it')
    for old, new in (REDIR, SITE, WWW):
        text = swap(text, old, new)
    if 'madelarme' in text:
        raise SystemExit('Unexpected madelarme entries remain; nothing changed')
    text += BLOCK
else:
    text = swap(text, BLOCK, '')
    if 'madelarme' in text:
        raise SystemExit('Unexpected madelarme entries remain; nothing changed')
    for old, new in (REDIR, SITE, WWW):
        text = swap(text, new, old)
after = text.encode()

stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
EVIDENCE.mkdir(parents=True, exist_ok=True)
prefix = EVIDENCE / ('caddy-' + stamp + '-' + operation)
Path(str(prefix) + '.before').write_bytes(before)
Path(str(prefix) + '.candidate').write_bytes(after)
validation = subprocess.run(
    ['docker', 'exec', '-i', CONTAINER, 'caddy', 'validate', '--config', '/dev/stdin', '--adapter', 'caddyfile'],
    input=after, capture_output=True,
)
Path(str(prefix) + '.validation.log').write_bytes(validation.stdout + validation.stderr)
if validation.returncode != 0:
    raise SystemExit('Caddy validation failed; live file unchanged')
if CONFIG.read_bytes() != before:
    raise SystemExit('Caddy changed during validation; live file unchanged')
state_before = subprocess.check_output(['docker', 'inspect', CONTAINER, '--format', '{{.State.StartedAt}}'], text=True).strip()
try:
    write_existing(after)
    subprocess.run(['docker', 'kill', '--signal=USR1', CONTAINER], check=True, capture_output=True)
except BaseException:
    write_existing(before)
    subprocess.run(['docker', 'kill', '--signal=USR1', CONTAINER], check=False, capture_output=True)
    raise
state_after = subprocess.check_output(['docker', 'inspect', CONTAINER, '--format', '{{.State.StartedAt}}'], text=True).strip()
result = {'operation': operation, 'before_sha256': digest(before), 'after_sha256': digest(after),
          'container_not_restarted': state_before == state_after, 'applied_config_file': str(CONFIG),
          'runtime_route_verification': 'required separately'}
Path(str(prefix) + '.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
