from modules.paths_internal import extensions_dir
from pathlib import Path
import urllib.request
import subprocess

def _Req():
    parser = Path(extensions_dir) / 'sd-image-parser'

    if not parser.exists():
        exif = {
            (parser / 'javascript/exif-reader.js'): 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/dist/exif-reader.js',
            (parser / 'javascript/exif-reader-LICENSE'): 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/LICENSE'
        }

        subprocess.run(['git', 'clone', '-q', 'https://github.com/gutris1/sd-image-parser', str(parser)], check=True)

        for files, url in exif.items():
            if not files.exists():
                files.write_bytes(urllib.request.urlopen(url).read())

_Req()
