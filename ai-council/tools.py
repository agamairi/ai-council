from ddgs import DDGS
import PyPDF2
import os

class CouncilTools:
    """Tools available to the AI Council"""
    
    @staticmethod
    def web_search(query, max_results=5):
        """Search the web using DuckDuckGo"""
        try:
            ddgs = DDGS()
            results = list(ddgs.text(query, max_results=max_results))
            
            if not results:
                return "No search results found."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                formatted_results.append(
                    f"{i}. {result.get('title', 'No title')}\n"
                    f"   {result.get('body', 'No description')}\n"
                    f"   URL: {result.get('href', 'N/A')}"
                )
            
            return "\n\n".join(formatted_results)
        except Exception as e:
            return f"Search failed: {str(e)}"
    
    @staticmethod
    def read_pdf(file_path):
        """Extract text from a PDF file"""
        try:
            if not os.path.exists(file_path):
                return f"Error: File not found at {file_path}"
            
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                # Read all pages (limit to first 10 for brevity)
                max_pages = min(10, len(pdf_reader.pages))
                for page_num in range(max_pages):
                    page = pdf_reader.pages[page_num]
                    text += f"\n--- Page {page_num + 1} ---\n"
                    text += page.extract_text()
                
                if len(pdf_reader.pages) > max_pages:
                    text += f"\n\n(Truncated. Total pages: {len(pdf_reader.pages)})"
                
                return text if text.strip() else "No text could be extracted from the PDF."
        except Exception as e:
            return f"Error reading PDF: {str(e)}"
    
    @staticmethod
    def read_document(file_path):
        """Read text from various document formats"""
        try:
            if not os.path.exists(file_path):
                return f"Error: File not found at {file_path}"
            
            _, ext = os.path.splitext(file_path)
            
            if ext.lower() == '.pdf':
                return CouncilTools.read_pdf(file_path)
            elif ext.lower() == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    return content if content.strip() else "File is empty."
            elif ext.lower() in ['.doc', '.docx']:
                try:
                    import docx
                    doc = docx.Document(file_path)
                    text = '\n'.join([para.text for para in doc.paragraphs])
                    return text if text.strip() else "Document is empty."
                except ImportError:
                    return "Error: python-docx not installed. Run: pip install python-docx"
            else:
                return f"Unsupported file format: {ext}"
        except Exception as e:
            return f"Error reading document: {str(e)}"
    
    @staticmethod
    def calculate(expression):
        """Safely evaluate mathematical expressions"""
        try:
            # Only allow safe math operations
            import re
            # Remove whitespace
            expression = expression.strip()
            
            # Check for dangerous patterns
            dangerous = ['import', '__', 'eval', 'exec', 'open', 'file']
            if any(d in expression.lower() for d in dangerous):
                return "Error: Invalid expression"
            
            # Replace common patterns
            expression = expression.replace('^', '**').replace('÷', '/')
            
            # Evaluate safely
            allowed_names = {
                'abs': abs, 'round': round, 'min': min, 'max': max,
                'sum': sum, 'pow': pow
            }
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            return f"{expression} = {result}"
        except Exception as e:
            return f"Calculation error: {str(e)}"
