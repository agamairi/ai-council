from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from council_orchestrator import AICouncil
import threading
import base64
import tempfile
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'council-secret-key'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=16 * 1024 * 1024)

council = AICouncil()

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('get_models')
def handle_get_models():
    """Send list of available models to frontend"""
    models = [
        {'name': advisor['name'], 'model': advisor['model'], 'role': advisor['role']}
        for advisor in council.advisors
    ]
    emit('models_list', {'models': models})

@socketio.on('get_default_settings')
def handle_get_default_settings():
    """Send default advisor settings and available models"""
    emit('default_settings', {
        'advisors': council.default_advisors,
        'available_models': council.get_available_models(),
        'ollama_host': council.ollama_host
    })

@socketio.on('refresh_models')
def handle_refresh_models():
    """Refresh available models from Ollama server"""
    try:
        models = council.get_available_models()
        emit('models_refreshed', {
            'success': True,
            'models': models
        })
    except Exception as e:
        emit('models_refreshed', {
            'success': False,
            'error': str(e)
        })

@socketio.on('test_endpoint')
def handle_test_endpoint(data):
    """Test connection to Ollama endpoint"""
    endpoint = data.get('endpoint', 'http://localhost:11434')
    try:
        from ollama import Client
        test_client = Client(host=endpoint)
        test_client.list()
        emit('endpoint_tested', {
            'success': True,
            'message': 'Connection successful!'
        })
    except Exception as e:
        emit('endpoint_tested', {
            'success': False,
            'error': str(e)
        })

@socketio.on('update_settings')
def handle_update_settings(data):
    """Update council settings"""
    try:
        custom_advisors = data.get('advisors', [])
        ollama_host = data.get('ollama_host', 'http://localhost:11434')
        
        # Update Ollama host
        council.set_ollama_host(ollama_host)
        
        # Update advisors
        council.update_advisors(custom_advisors)
        
        emit('settings_updated', {'success': True})
    except Exception as e:
        emit('settings_updated', {'success': False, 'error': str(e)})

@socketio.on('upload_file')
def handle_file_upload(data):
    """Handle file uploads and save temporarily"""
    try:
        file_data = data['file_data']
        file_name = data['file_name']
        
        file_bytes = base64.b64decode(file_data.split(',')[1] if ',' in file_data else file_data)
        
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, file_name)
        
        with open(file_path, 'wb') as f:
            f.write(file_bytes)
        
        emit('file_uploaded', {
            'file_name': file_name,
            'file_path': file_path,
            'success': True
        })
    except Exception as e:
        emit('file_uploaded', {
            'success': False,
            'error': str(e)
        })

@socketio.on('convene_council')
def handle_council_question(data):
    question = data['question']
    mode = data.get('mode', 'normal')
    selected_model = data.get('selected_model', None)
    enabled_tools = data.get('tools', {'document_reading': False, 'calculator': False})
    uploaded_file = data.get('uploaded_file', None)
    
    if uploaded_file and enabled_tools.get('document_reading'):
        question = f'Read and analyze the file "{uploaded_file}". {question}'
    
    def message_callback(message):
        socketio.emit('council_message', message)
    
    def run_council():
        socketio.emit('council_started', {'question': question, 'mode': mode})
        try:
            responses = council.convene_council(
                question=question,
                callback=message_callback,
                mode=mode,
                selected_model=selected_model,
                enabled_tools=enabled_tools
            )
            socketio.emit('council_complete', {'responses': responses})
        except Exception as e:
            socketio.emit('council_error', {'error': str(e)})
    
    thread = threading.Thread(target=run_council)
    thread.daemon = True
    thread.start()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=6969, debug=True)
