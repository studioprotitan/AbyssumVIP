from pathlib import Path
from datetime import datetime
p = Path(r'e:\AbyssumVIP\Content\dvv_log.txt')
e = f'[{datetime.now():%Y-%m-%d %H:%M:%S}] Environment check: Windows host; workspace at e:\\AbyssumVIP\\Content; no code errors found; ready for next task.'
with p.open('a', encoding='utf-16') as f:
    f.write(e + '\n')
print('Appended')
