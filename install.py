from pathlib import Path
import urllib.request
import subprocess

from modules.paths_internal import extensions_dir

def _Req():
    n = 'sd-image-scripts'
    p = Path(extensions_dir) / n

    if not p.exists():
        subprocess.run(['git', 'clone', '-q', f'https://github.com/gutris1/{n}', str(p)], check=True)

        e = {
            (p / 'javascript/exif-reader.js'): 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/dist/exif-reader.js',
            (p / 'javascript/exif-reader-LICENSE'): 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/LICENSE'
        }

        for f, u in e.items():
            if not f.exists():
                f.write_bytes(urllib.request.urlopen(u).read())

_Req()