from modules.paths_internal import extensions_dir
from pathlib import Path
import urllib.request

def ExifReader():
    exif = Path(extensions_dir) / 'Exif-Reader/javascript'
    exif.mkdir(parents=True, exist_ok=True)

    req = {
        'exif-reader.js': 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/dist/exif-reader.js',
        'exif-reader-LICENSE': 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/LICENSE'
    }

    for f, u in req.items():
        fp = exif / f
        if not fp.exists():
            fp.write_bytes(urllib.request.urlopen(u).read())

ExifReader()
