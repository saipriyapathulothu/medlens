"""
MedLens Clinical PDF Exporter Service
-------------------------------------
Generates structured, professional clinical summary PDFs using ReportLab.
Includes:
- MedLens header with branding
- Patient intake information (symptoms, medications, allergies)
- Structured laboratory results table with reference ranges and deterministic status tags
- Permanent non-diagnostic medical disclaimer banner
"""

import io
from typing import List, Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)

DISCLAIMER_TEXT = (
    "NOTICE: MedLens is an information organization and summarization tool. "
    "It does not provide medical diagnosis, prescribe medication, "
    "recommend dosage changes, or replace professional medical advice."
)


def generate_clinical_pdf(
    patient_info: Dict[str, Any],
    report_info: Optional[Dict[str, Any]],
    lab_results: List[Dict[str, Any]],
    summary_text: Optional[str] = None
) -> io.BytesIO:
    """Generates a PDF document in memory and returns a BytesIO buffer."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#026ec7')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#92400e')
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("MedLens Clinical Information Summary", title_style))
    story.append(Paragraph("AI-Powered Clinical Record & Deterministic Reference Range Evaluation", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#026ec7'), spaceAfter=14))

    # 2. Responsible AI Disclaimer Box
    disclaimer_box = Table(
        [[Paragraph(DISCLAIMER_TEXT, disclaimer_style)]],
        colWidths=[532]
    )
    disclaimer_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#f59e0b')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(disclaimer_box)
    story.append(Spacer(1, 14))

    # 3. Patient Information Section
    story.append(Paragraph("1. Patient Intake Record", section_style))
    
    p_name = f"{patient_info.get('first_name', '')} {patient_info.get('last_name', '')}".strip() or "Anonymous"
    p_age = f"{patient_info.get('age', 'N/A')} Years"
    p_sex = patient_info.get('sex', 'N/A')
    p_dob = patient_info.get('date_of_birth', 'N/A')

    patient_table_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {p_name}", body_style),
            Paragraph(f"<b>Age / Sex:</b> {p_age} / {p_sex}", body_style),
            Paragraph(f"<b>DOB:</b> {p_dob}", body_style)
        ],
        [
            Paragraph(f"<b>Symptoms:</b> {patient_info.get('symptoms') or 'None reported'}", body_style),
            Paragraph(f"<b>Allergies:</b> {patient_info.get('allergies') or 'None reported'}", body_style),
            Paragraph(f"<b>Medications:</b> {patient_info.get('current_medications') or 'None reported'}", body_style)
        ]
    ]

    p_table = Table(patient_table_data, colWidths=[177, 177, 178])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 14))

    # 4. Report Metadata
    if report_info:
        r_file = report_info.get("file_name", "Uploaded Document")
        r_date = report_info.get("report_date", "Unspecified")
        r_lab = report_info.get("lab_facility", "Standard Lab Facility")
        meta_p = Paragraph(f"<b>Source Report:</b> {r_file} &nbsp;|&nbsp; <b>Date:</b> {r_date} &nbsp;|&nbsp; <b>Facility:</b> {r_lab}", body_style)
        story.append(meta_p)
        story.append(Spacer(1, 10))

    # 5. Structured Laboratory Results Table
    story.append(Paragraph("2. Structured Laboratory Results", section_style))

    table_data = [
        ["Test Name", "Result", "Unit", "Source Reference Range", "Deterministic Status"]
    ]

    for lab in lab_results:
        status_val = lab.get("status", "NOT_DETERMINED")
        table_data.append([
            lab.get("test_name", ""),
            str(lab.get("result_value", "")),
            lab.get("unit", "") or "-",
            lab.get("reference_range_raw", "") or "Not Specified",
            status_val
        ])

    lab_table = Table(table_data, colWidths=[160, 60, 60, 140, 112])
    t_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#026ec7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (1, 0), (2, -1), 'CENTER'),
        ('ALIGN', (4, 0), (4, -1), 'CENTER'),
    ]

    # Color status cells
    for row_idx in range(1, len(table_data)):
        status_text = table_data[row_idx][4]
        if status_text == "HIGH":
            t_styles.append(('TEXTCOLOR', (4, row_idx), (4, row_idx), colors.HexColor('#b91c1c')))
            t_styles.append(('FONTNAME', (4, row_idx), (4, row_idx), 'Helvetica-Bold'))
        elif status_text == "LOW":
            t_styles.append(('TEXTCOLOR', (4, row_idx), (4, row_idx), colors.HexColor('#c2410c')))
            t_styles.append(('FONTNAME', (4, row_idx), (4, row_idx), 'Helvetica-Bold'))
        elif status_text == "NORMAL":
            t_styles.append(('TEXTCOLOR', (4, row_idx), (4, row_idx), colors.HexColor('#047857')))
        else:
            t_styles.append(('TEXTCOLOR', (4, row_idx), (4, row_idx), colors.HexColor('#475569')))

    lab_table.setStyle(TableStyle(t_styles))
    story.append(lab_table)
    story.append(Spacer(1, 14))

    # 6. Clinical Summary (if available)
    if summary_text:
        story.append(Paragraph("3. Clinical Information Overview", section_style))
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 14))

    # Build document
    doc.build(story)
    buffer.seek(0)
    return buffer
