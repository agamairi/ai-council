#!/bin/bash

echo "🚀 Starting AI Council..."
echo ""

# Check if virtual environment exists
if [ ! -d "council-env" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv council-env
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating environment..."
source council-env/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt
echo ""

# Check if Ollama is running
echo "🔍 Checking Ollama connection..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Warning: Ollama doesn't seem to be running on localhost:11434"
    echo ""
    echo "Please start Ollama in another terminal with:"
    echo "  ollama serve"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ Ollama is running"
fi

echo ""
echo "✨ Starting AI Council..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Open your browser and visit:"
echo "     http://localhost:6969"
echo ""
echo "  📱 Access from phone/other devices:"
echo "     http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):6969"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the application
python ./ai-council/app.py
