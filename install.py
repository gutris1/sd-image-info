from modules.paths_internal import extensions_dir
from pathlib import Path
import subprocess

def _Req():
    parser = Path(extensions_dir) / 'sd-image-parser'

    if not parser.exists():
        subprocess.run(['git', 'clone', '-q', 'https://github.com/gutris1/sd-image-parser', str(parser)], check=True)

_Req()
