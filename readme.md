# AI Council 🤖💬

<div align="center">

**A sophisticated multi-AI discussion platform where diverse LLM models collaborate to provide comprehensive perspectives on your questions.**

[Features](#-features) • [Installation](#-quick-start) • [Usage](#-usage-examples) • [Configuration](#%EF%B8%8F-configuration) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

AI Council transforms how you interact with Large Language Models by orchestrating discussions between multiple AI personalities. Each advisor brings unique expertise and thinking styles, creating a rich, multi-faceted analysis of your questions.

Think of it as having a personal board of AI advisors, each with distinct specialties, working together to give you the most comprehensive answer possible.

## ✨ Features

### 🎭 Multiple Discussion Modes

- **💬 Normal Discussion**: All advisors debate sequentially, building on each other's perspectives
- **🔍 Web Search**: Single AI performs web search for quick, factual queries
- **🔬 Deep Research**: All models independently research topics and share findings

### 🛠️ Powerful Tools

- **📄 Document Analysis**: Upload and analyze PDFs, DOCX, and TXT files (drag-and-drop supported)
- **🧮 Built-in Calculator**: Solve mathematical expressions on the fly
- **🌐 Web Search**: Real-time internet search via DuckDuckGo API

### ⚙️ Full Customization

- **Drag & Drop Reordering**: Arrange advisors in any order you prefer
- **12 Preset Roles**: Quick setup with pre-configured personalities
- **Custom System Prompts**: Fine-tune how each advisor thinks and responds
- **Model Selection**: Assign any Ollama model to any advisor
- **Remote Ollama Support**: Connect to Ollama running on different machines

### 🎨 Modern Interface

- **Dark Mode UI**: ChatGPT inspired design
- **Markdown Rendering**: Beautiful formatting for code, tables, lists, and more
- **Real-time Updates**: Watch advisors think and respond live
- **Mobile Friendly**: Access from any device on your network
- **Persistent Settings**: Preferences saved locally in browser

## 🚀 Quick Start

### Prerequisites

1. **Python 3.9 or higher**
   python3 --version

2. **Ollama installed and running**

- Download from [ollama.com](https://ollama.com/)
- Verify installation: `ollama --version`

3. **At least one Ollama model downloaded**
   `ollama pull llama3.2:3b`

### Installation

#### Automated Setup (Recommended)

**macOS/Linux:**
Clone or download the project

Make startup script executable
`chmod +x start.sh`

Run the application
`./start.sh`

**Windows:**
Navigate to project folder

Run the startup script
`start.bat`

The script will automatically:

- Create a virtual environment
- Install all dependencies
- Check if Ollama is running
- Start the application

### Access the Application

Open your browser and navigate to:
http://localhost:6969

**Access from phone or other devices:**

1. Find your computer's IP address:
   macOS/Linux: `ifconfig | grep "inet "`
   Windows: `ipconfig`
2. On your phone, visit: `http://YOUR_IP:6969`

## 💡 Usage Examples

### Normal Discussion Mode

Ask any question and get diverse perspectives:

-> Question: "What are the ethical implications of AI in healthcare?"

-> Advisors will debate, have creative angles and innovative applications,data-driven analysis and statistics, philosophical considerations, practical implementation challenges, technical requirements

-> Final synthesis and recommendations

### Web Search Mode

For quick factual queries with internet access:

Question: "What's the current weather in Tokyo and major news today?"

→ Single model searches the web and provides up-to-date information

### Deep Research Mode

For complex topics requiring thorough investigation:

Question: "What are the latest breakthroughs in quantum computing?"

→ All models independently research and share unique findings
→ Comprehensive coverage from multiple angles

### Document Analysis

Upload a PDF and get insights:

Click + button → Upload Document

Drag and drop your PDF file

Ask: "Summarize the key findings and methodology"

→ Advisors analyze and discuss the document content

### Customization via Settings

Click the **⚙️ Settings** icon to customize:

#### 1. **Ollama Endpoint**

Default: http://localhost:11434
Remote: http://192.168.1.100:11434

- Test connection before saving
- Click "Refresh Models" to detect available models

#### 2. **Advisor Configuration**

**Drag & Drop Reordering:**

- Grab the ☰ handle to reorder advisors
- Order determines speaking sequence
- Keep synthesizer last for best results

**Preset Roles:**
Choose any of the preset roles inspired by different miniseries

**Custom Configuration:**

- **Name**: Display name for the advisor
- **Role**: Their expertise/specialty
- **Model**: Which Ollama model to use
- **System Prompt**: Define their thinking style

#### 3. **Add/Remove Advisors**

- Click "+ Add Advisor" to expand your council
- Delete button to remove advisors
- Minimum: 1 advisor required

Settings are **automatically saved** to your browser's localStorage.

### Recommended Models to Download

Lightweight options (good for 8GB RAM)
ollama pull llama3.2:3b
ollama pull gemma3n:e2b
ollama pull qwen3:1.7b

Mid-range (16GB+ RAM)
ollama pull phi4-mini:3.8b
ollama pull qwen2.5-coder:3b
ollama pull granite3.3:2b

List all available models
ollama list

## Screenshots
<table> <tr> <td><img src="https://github.com/user-attachments/assets/423f537a-a629-4e0f-bae7-91e714c03a25" alt="Screenshot 1" /></td> </tr> <tr> <td><img src="https://github.com/user-attachments/assets/87055d97-0634-466e-9be4-7050095a8801" alt="Screenshot 2" /></td> </tr> <tr> <td><img src="https://github.com/user-attachments/assets/f0fe7376-acb2-4006-a9fc-13f239528b37" alt="Screenshot 3" /></td> </tr> </table>

## 🔧 Advanced Usage

### Running on a Different Port

Edit app.py, change the last line:
socketio.run(app, host='0.0.0.0', port=8080, debug=True)

### Remote Ollama Setup

**On the Ollama host machine:**
macOS/Linux
export OLLAMA_HOST=0.0.0.0:11434
ollama serve

Windows
set OLLAMA_HOST=0.0.0.0:11434
ollama serve

**In AI Council settings:**

1. Enter: `http://OLLAMA_HOST_IP:11434`
2. Click "Test" to verify
3. Click "Refresh Models"
4. Save settings

## 💻 Hardware Requirements

| Requirement | Minimum        | Recommended                 |
| ----------- | -------------- | --------------------------- |
| RAM         | 8GB            | 16GB+                       |
| CPU         | Any modern CPU | Multi-core processor        |
| Storage     | 10GB           | 20GB+ (for multiple models) |
| Network     | Local only     | LAN access for multi-device |

**Note**: Models run sequentially (one at a time), making it work well on modest hardware like intel i5 9th gen, GTX 1650 4GB VRAM, 16gb DDR4 RAM.

## 🐛 Troubleshooting

### "Connection refused" error

Verify Ollama is running
`ollama list`

Start Ollama if needed
`ollama serve`

Check endpoint in Settings ⚙️

### Models not detected

Refresh models in settings
Or manually verify:
`ollama list`

Pull missing models:
`ollama pull llama3.2:3b`

### Empty responses from models

- Some models need different prompts
- Try adjusting the system prompt in settings
- Ensure model is fully downloaded: `ollama list`

### File upload not working

- Check file size (max 16MB)
- Supported formats: PDF, DOCX, TXT
- Ensure Documents tool is enabled (toggle in + menu)

### Port already in use

Find process using port 6969
macOS/Linux:
lsof -i :6969

Windows:
netstat -ano | findstr :6969

Kill the process or use a different port

## 🔐 Security Considerations

- **Local by default**: Runs on localhost only unless configured otherwise
- **No authentication**: Add authentication if exposing to internet
- **Trusted models**: System trusts AI output (no HTML sanitization)
- **File uploads**: Stored temporarily, cleared on server restart
- **Network exposure**: Use firewall when running on 0.0.0.0

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ideas for Contributions

- 🎨 UI/UX improvements
- 🔧 New tool integrations (APIs, databases, etc.)
- 🌍 Internationalization (i18n)
- 📊 Analytics and insights on discussions
- 🔌 Plugin system for extensibility
- 📱 Native mobile app wrapper
- 🐳 Docker containerization
- ✅ Unit tests and CI/CD

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** - feel free to use, modify, and distribute as you wish.

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with amazing open-source tools:

- Flask - Web framework
- Flask-SocketIO - Real-time communication
- Ollama - Local LLM infrastructure
- DuckDuckGo Search- Web search API
- PyPDF2 - PDF processing
- Marked.js - Markdown rendering
- **Icons** - [Heroicons](https://heroicons.com)

## 📞 Support

- 🐛 **Bug Reports**: Open an issue with detailed steps to reproduce
- 💡 **Feature Requests**: Describe your use case and proposed solution
- ❓ **Questions**: Check existing issues or open a new discussion

## 🗺️ Roadmap

Future enhancements being considered:

- [ ] Conversation history and export
- [ ] Voice input/output
- [ ] Model performance analytics
- [ ] Integration with external APIs
- [ ] Streaming responses (word-by-word)

---

<div align="center">

**Made with ❤️ for the AI community**

⭐ Star this repo if you find it useful!

</div>
