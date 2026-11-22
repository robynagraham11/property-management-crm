#!/usr/bin/env python3
"""Build branded .docx versions of the service agreements from the markdown sources.

Usage: python3 build-docx.py
Output: 01-property-management-agreement.docx, 02-tenant-placement-agreement.docx
Requires: pip3 install --user python-docx
"""
import re
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

INK = RGBColor(0x0D, 0x0D, 0x0D)
TEAL = RGBColor(0x00, 0xAD, 0xC0)
GREY = RGBColor(0x66, 0x66, 0x66)
SERIF = "Playfair Display"
SANS = "Montserrat"
MONO = "Courier New"

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

FILES = [
    ("01-property-management-agreement.md", "01-property-management-agreement.docx"),
    ("02-tenant-placement-agreement.md", "02-tenant-placement-agreement.docx"),
    ("05-property-information-and-authorization.md", "05-property-information-and-authorization.docx"),
    ("06-tenant-rental-application.md", "06-tenant-rental-application.docx"),
    ("07-screening-consent.md", "07-screening-consent.docx"),
    ("08-tenant-approval-record.md", "08-tenant-approval-record.docx"),
    ("09-placement-completion-handover-checklist.md", "09-placement-completion-handover-checklist.docx"),
    ("10-pre-authorized-debit-agreement.md", "10-pre-authorized-debit-agreement.docx"),
    ("11-monthly-owner-statement.md", "11-monthly-owner-statement.docx"),
    ("12-strata-document-request.md", "12-strata-document-request.docx"),
    ("13-placement-file-checklist.md", "13-placement-file-checklist.docx"),
    ("14-tenant-placement-one-pager.md", "14-tenant-placement-one-pager.docx"),
]

INLINE_RE = re.compile(r"(\*\*.+?\*\*|\*[^*]+?\*|\[[^\]]+\]\([^)]+\))")

def set_font(run, name, size, bold=False, italic=False, color=INK):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = rPr.makeelement(qn("w:rFonts"), {})
        rPr.append(rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:cs"), name)

def add_runs(paragraph, text, size, bold=False, italic=False, color=INK, name=SANS):
    pos = 0
    for m in INLINE_RE.finditer(text):
        if m.start() > pos:
            r = paragraph.add_run(text[pos:m.start()])
            set_font(r, name, size, bold, italic, color)
        token = m.group(0)
        if token.startswith("**"):
            r = paragraph.add_run(token[2:-2])
            set_font(r, name, size, True, italic, color)
        elif token.startswith("[") and "]" in token and token.endswith(")"):
            label, url = token[1:-1].split("](", 1)
            r = paragraph.add_run(label)
            set_font(r, name, size, bold, italic, TEAL)
            r2 = paragraph.add_run(f" ({url})")
            set_font(r2, name, size - 1, False, italic, GREY)
        else:
            r = paragraph.add_run(token[1:-1])
            set_font(r, name, size, bold, True, color)
        pos = m.end()
    if pos < len(text):
        r = paragraph.add_run(text[pos:])
        set_font(r, name, size, bold, italic, color)

def add_para(doc, text="", style_kind="body"):
    if style_kind == "h1":
        p = doc.add_paragraph()
        add_runs(p, text, 20, bold=True, name=SERIF)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
    elif style_kind == "h2":
        p = doc.add_paragraph()
        add_runs(p, text, 15, bold=True, name=SERIF)
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
    elif style_kind == "h3":
        p = doc.add_paragraph()
        add_runs(p, text, 12, bold=True, name=SERIF)
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
    elif style_kind == "h4":
        p = doc.add_paragraph()
        add_runs(p, text.upper(), 10, bold=True, color=TEAL)
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
    elif style_kind == "quote":
        p = doc.add_paragraph()
        add_runs(p, text, 9.5, italic=True, color=TEAL)
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
    elif style_kind == "tagline":
        p = doc.add_paragraph()
        add_runs(p, text, 11, italic=True, color=INK, name=SERIF)
        p.paragraph_format.space_after = Pt(8)
    elif style_kind == "bullet":
        p = doc.add_paragraph(style="List Bullet")
        add_runs(p, text, 10.5)
    elif style_kind == "numbered":
        p = doc.add_paragraph()
        add_runs(p, text, 10.5)
        p.paragraph_format.left_indent = Inches(0.35)
        p.paragraph_format.first_line_indent = Inches(-0.35)
    elif style_kind == "sig":
        p = doc.add_paragraph()
        add_runs(p, text, 10.5)
        p.paragraph_format.space_before = Pt(10)
    else:
        p = doc.add_paragraph()
        add_runs(p, text, 10.5)
        p.paragraph_format.space_after = Pt(4)
    return p

def add_table(doc, rows):
    ncols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=ncols)
    table.style = "Table Grid"
    for i, row in enumerate(rows):
        for j in range(ncols):
            cell = table.cell(i, j)
            cell.text = ""
            p = cell.paragraphs[0]
            txt = row[j] if j < len(row) else ""
            add_runs(p, txt, 10)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table

def parse_table_row(line):
    if line.strip().startswith("|"):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c != ""):
            return None
        return cells
    return None

def convert(md_path, docx_path):
    lines = md_path.read_text(encoding="utf-8").splitlines()
    doc = Document()
    doc.core_properties.title = md_path.stem.replace("-", " ").title()
    doc.core_properties.author = "Robyn Graham | Stonehaus Realty Corp."

    normal = doc.styles["Normal"]
    normal.font.name = SANS
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = INK

    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    footer_p = doc.sections[0].footer.paragraphs[0]
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = footer_p.add_run("Rent With Robyn · Stonehaus Realty Corp. · 778 926 3481 · robyn@rentwithrobyn.ca · robyngraham.ca")
    set_font(r, SANS, 8, color=GREY)

    i = 0
    in_table = False
    table_rows = []
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if stripped == "---" or stripped == "":
            if in_table and table_rows:
                add_table(doc, table_rows)
                in_table, table_rows = False, []
            i += 1
            continue
        row = parse_table_row(line)
        if row is not None:
            in_table = True
            table_rows.append(row)
            i += 1
            continue
        if in_table and table_rows:
            add_table(doc, table_rows)
            in_table, table_rows = False, []
        if stripped.startswith("#### "):
            add_para(doc, stripped[5:], "h4")
        elif stripped.startswith("### "):
            add_para(doc, stripped[4:], "h3")
        elif stripped.startswith("## "):
            add_para(doc, stripped[3:], "h2")
        elif stripped.startswith("# "):
            add_para(doc, stripped[2:], "h1")
        elif stripped.startswith(">> "):
            add_para(doc, stripped[3:], "quote")
        elif stripped.startswith("> "):
            add_para(doc, stripped[2:], "quote")
        elif stripped.startswith("- "):
            add_para(doc, stripped[2:], "bullet")
        elif re.match(r"^\d+\.\d*\s", stripped) or re.match(r"^\d+\.\s", stripped):
            add_para(doc, stripped, "numbered")
        elif stripped.startswith("*") and stripped.endswith("*") and stripped.count("*") == 2:
            add_para(doc, stripped.strip("*"), "tagline")
        elif stripped.startswith("Signature:") or stripped.startswith("Print name:") or stripped.startswith("Licence #") or stripped.startswith("Initials:"):
            add_para(doc, stripped, "sig")
        else:
            add_para(doc, stripped, "body")
        i += 1
    if in_table and table_rows:
        add_table(doc, table_rows)

    doc.save(docx_path)
    print(f"wrote {docx_path}")

if __name__ == "__main__":
    for src, out in FILES:
        convert(ROOT / src, ROOT / out)
