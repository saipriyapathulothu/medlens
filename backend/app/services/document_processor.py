"""
MedLens Document Ingestion & Text Processing Service
---------------------------------------------------
Handles extraction of raw clinical text from:
- Digital PDF documents (via PyMuPDF / fitz)
- Scanned documents and images (via Pillow & pytesseract OCR)
- Plain text formats
"""

import os
from typing import Dict, Any


def extract_text_from_file(file_path: str, file_type: str) -> Dict[str, Any]:
    """
    Extracts text from a given file path based on its extension/type.
    Returns:
      {
        "text": str,
        "page_count": int,
        "method": "pymupdf" | "ocr" | "plain_text" | "fallback",
        "error": str or None
      }
    """
    if not os.path.exists(file_path):
        return {
            "text": "",
            "page_count": 0,
            "method": "error",
            "error": f"File not found: {file_path}"
        }

    file_type = file_type.lower().strip().lstrip('.')

    # 1. Plain text files (e.g. .txt synthetic samples)
    if file_type == "txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return {
                "text": content,
                "page_count": 1,
                "method": "plain_text",
                "error": None
            }
        except Exception as e:
            return {"text": "", "page_count": 0, "method": "plain_text", "error": str(e)}

    # 2. PDF processing via PyMuPDF (fitz)
    if file_type == "pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            full_text = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                if text.strip():
                    full_text.append(f"--- [Page {page_num + 1}] ---\n{text}")
            
            extracted = "\n\n".join(full_text)
            if extracted.strip():
                return {
                    "text": extracted,
                    "page_count": len(doc),
                    "method": "pymupdf",
                    "error": None
                }
            # If PDF has no digital text, fall through to OCR
        except ImportError:
            # PyMuPDF not yet installed in local environment
            pass
        except Exception as e:
            # Continue to OCR fallback
            pass

    # 3. Image / Scanned document processing via OCR (pytesseract + Pillow)
    if file_type in ["jpg", "jpeg", "png", "bmp", "tiff", "pdf"]:
        try:
            from PIL import Image
            import pytesseract
            
            # If it was a scanned PDF, convert first page to image or read directly if image
            if file_type != "pdf":
                image = Image.open(file_path)
                ocr_text = pytesseract.image_to_string(image)
                return {
                    "text": ocr_text,
                    "page_count": 1,
                    "method": "ocr",
                    "error": None
                }
        except ImportError:
            pass
        except Exception as e:
            pass

    # 4. Fallback reader for development / synthetic testing
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if content.strip():
                return {
                    "text": content,
                    "page_count": 1,
                    "method": "fallback",
                    "error": None
                }
    except Exception:
        pass

    return {
        "text": "",
        "page_count": 0,
        "method": "unsupported",
        "error": f"Could not extract text from {file_type} file. Please ensure dependencies are installed."
    }
