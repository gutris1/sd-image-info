from pathlib import Path
import urllib.request

r = {
    'javascript/exif-reader.js': 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/dist/exif-reader.js',
    'javascript/exif-reader-LICENSE': 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/LICENSE'
}

for f, u in r.items():
    fp = Path(__file__).parent / f
    if not fp.exists():
        fp.write_bytes(urllib.request.urlopen(u).read())
