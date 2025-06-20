import PyPDF2
from pathlib import Path

pdf_path = Path('tmp') / 'QUESTIONNAIRE EXPORT COMPTA NEW.pdf'
reader = PyPDF2.PdfReader(str(pdf_path))
print('Pages:', len(reader.pages))

out = []
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    out.append(f"\n--- Page {i+1} ---\n")
    if text:
        out.append(text)

Path('pdf_dump.txt').write_text('\n'.join(out), encoding='utf-8')
print('Saved to pdf_dump.txt') 