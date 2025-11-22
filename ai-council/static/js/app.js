const socket = io();

// DOM Elements
const sendBtn = document.getElementById('send-btn');
const progress = document.getElementById('progress');
const messagesDiv = document.getElementById('messages');
const chatContainer = document.getElementById('chat-container');
const questionInput = document.getElementById('question');
const plusButton = document.getElementById('plus-button');
const plusMenu = document.getElementById('plus-menu');
const modelSelectWrapper = document.getElementById('model-select-wrapper');
const modelSelect = document.getElementById('model-select');
const toolsSection = document.getElementById('tools-section');
const inputBoxWrapper = document.getElementById('input-box-wrapper');
const fileAttachment = document.getElementById('file-attachment');
const fileNameSpan = document.getElementById('file-name');
const fileInput = document.getElementById('file-input');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const advisorsContainer = document.getElementById('advisors-container');
const endpointInput = document.getElementById('endpoint-input');
const endpointStatus = document.getElementById('endpoint-status');
const modelsCount = document.getElementById('models-count');

// Configure marked.js for better rendering
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,        // Convert \n to <br>
        gfm: true,          // GitHub Flavored Markdown
        headerIds: false,   // Don't add IDs to headers
        mangle: false,      // Don't escape autolinked email addresses
        sanitize: false     // Allow HTML (we trust our models)
    });
}

// Markdown rendering function
function renderMarkdown(text) {
    if (!text) return '';
    
    try {
        // Use marked.js to convert markdown to HTML
        if (typeof marked !== 'undefined') {
            return marked.parse(text);
        } else {
            // Fallback to plain text if marked.js isn't loaded
            return escapeHtml(text).replace(/\n/g, '<br>');
        }
    } catch (error) {
        console.error('Markdown rendering error:', error);
        return escapeHtml(text).replace(/\n/g, '<br>');
    }
}


// Ministry-themed Role Presets
const rolePresets = {
    'custom': {
        role: 'Custom Role',
        personality: 'You are a helpful AI advisor. Provide thoughtful insights.'
    },
    'innovation': {
        role: 'Minister of Innovation',
        personality: 'You are the Minister of Innovation. Think outside the box and propose innovative, unconventional solutions. Focus on cutting-edge approaches and creative thinking. Be brief (2-3 sentences).'
    },
    'finance': {
        role: 'Minister of Finance',
        personality: 'You are the Minister of Finance. Provide logical, quantitative analysis and data-driven insights. Focus on costs, benefits, and economic implications. Be brief (2-3 sentences).'
    },
    'technology': {
        role: 'Minister of Technology',
        personality: 'You are the Minister of Technology. Provide technical and scientific expertise. Focus on technical feasibility, implementation details, and engineering challenges. Be brief (2-3 sentences).'
    },
    'development': {
        role: 'Minister of Development',
        personality: 'You are the Minister of Development. Evaluate technical implementation approaches and provide concrete execution strategies. Focus on practical building and deployment. Be brief (2-3 sentences).'
    },
    'strategy': {
        role: 'Minister of Strategy',
        personality: 'You are the Minister of Strategy. Focus on practical implementation, risk assessment, and feasibility. Consider long-term implications and strategic planning. Be brief (2-3 sentences).'
    },
    'defense': {
        role: 'Minister of Defense',
        personality: 'You are the Minister of Defense. Identify risks, security concerns, and potential threats. Focus on protection, mitigation strategies, and defensive measures. Be brief (2-3 sentences).'
    },
    'foreign_affairs': {
        role: 'Minister of Foreign Affairs',
        personality: 'You are the Minister of Foreign Affairs. Consider external perspectives, international implications, and cross-cultural factors. Focus on diplomacy and global context. Be brief (2-3 sentences).'
    },
    'research': {
        role: 'Minister of Research',
        personality: 'You are the Minister of Research. Provide evidence-based analysis, scientific reasoning, and data-driven insights. Focus on facts, studies, and empirical evidence. Be brief (2-3 sentences).'
    },
    'education': {
        role: 'Minister of Education',
        personality: 'You are the Minister of Education. Focus on learning, knowledge transfer, and pedagogical approaches. Explain concepts clearly and accessibly. Be brief (2-3 sentences).'
    },
    'health': {
        role: 'Minister of Health',
        personality: 'You are the Minister of Health. Consider wellbeing, safety, and health implications. Focus on human-centered outcomes and welfare. Be brief (2-3 sentences).'
    },
    'environment': {
        role: 'Minister of Environment',
        personality: 'You are the Minister of Environment. Consider sustainability, environmental impact, and ecological implications. Focus on long-term planetary health. Be brief (2-3 sentences).'
    },
    'prime_minister': {
        role: 'Prime Minister',
        personality: 'You are the Prime Minister. Synthesize all ministerial perspectives, identify consensus, and provide final balanced recommendations. Lead with decisive conclusions. Be concise (3-4 sentences).'
    }
};


// State
let currentMode = 'normal';
let advisorElements = {};
let availableModels = [];
let availableOllamaModels = [];
let uploadedFile = null;
let menuOpen = false;
let draggedIndex = null;
let settings = {
    advisors: [],
    ollama_host: 'http://localhost:11434'
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('councilSettings');
    if (saved) {
        settings = JSON.parse(saved);
        if (settings.ollama_host) {
            endpointInput.value = settings.ollama_host;
        }
        socket.emit('update_settings', settings);
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('councilSettings', JSON.stringify(settings));
    socket.emit('update_settings', settings);
}

// Initialize
socket.on('connect', () => {
    socket.emit('get_models');
    socket.emit('get_default_settings');
    loadSettings();
});

socket.on('models_list', (data) => {
    availableModels = data.models;
    modelSelect.innerHTML = availableModels.map(m => 
        `<option value="${m.model}">${m.name} - ${m.role}</option>`
    ).join('');
});

socket.on('default_settings', (data) => {
    availableOllamaModels = data.available_models;
    
    if (!settings.advisors || settings.advisors.length === 0) {
        settings.advisors = data.advisors;
    }
    
    if (!settings.ollama_host && data.ollama_host) {
        settings.ollama_host = data.ollama_host;
        endpointInput.value = data.ollama_host;
    }
    
    updateModelsCount();
    updateEndpointStatus(true);
});

// Endpoint management
function testEndpoint() {
    const endpoint = endpointInput.value.trim();
    if (!endpoint) {
        alert('Please enter an endpoint URL');
        return;
    }
    
    progress.textContent = 'Testing connection...';
    socket.emit('test_endpoint', { endpoint: endpoint });
}

socket.on('endpoint_tested', (data) => {
    progress.textContent = '';
    if (data.success) {
        updateEndpointStatus(true);
        alert('✓ ' + data.message);
    } else {
        updateEndpointStatus(false);
        alert('✗ Connection failed: ' + data.error);
    }
});

function updateEndpointStatus(connected) {
    endpointStatus.textContent = connected ? 'Connected' : 'Disconnected';
    endpointStatus.className = `endpoint-status ${connected ? 'connected' : 'disconnected'}`;
}

function refreshModels() {
    progress.textContent = 'Refreshing models...';
    socket.emit('refresh_models');
}

socket.on('models_refreshed', (data) => {
    progress.textContent = '';
    if (data.success) {
        availableOllamaModels = data.models;
        updateModelsCount();
        renderAdvisorSettings();
        alert(`✓ Found ${data.models.length} models`);
    } else {
        alert('Failed to refresh models: ' + data.error);
    }
});

function updateModelsCount() {
    if (modelsCount) {
        modelsCount.textContent = `${availableOllamaModels.length} models detected`;
    }
}

// Settings Modal
function openSettings() {
    settingsModal.classList.add('visible');
    renderAdvisorSettings();
}

function closeSettings() {
    settingsModal.classList.remove('visible');
}

// Preset selection
function applyPreset(index, presetKey) {
    if (presetKey && presetKey !== 'custom') {
        const preset = rolePresets[presetKey];
        settings.advisors[index].role = preset.role;
        settings.advisors[index].personality = preset.personality;
        renderAdvisorSettings();
    }
}

function renderAdvisorSettings() {
    advisorsContainer.innerHTML = settings.advisors.map((advisor, index) => `
        <div class="advisor-config" 
             draggable="true" 
             data-index="${index}"
             ondragstart="handleDragStart(event, ${index})"
             ondragend="handleDragEnd(event)"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event, ${index})">
            
            <div class="advisor-config-header">
                <div class="advisor-config-title">
                    <span class="drag-handle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                        <span class="advisor-number">#${index + 1}</span>
                    </span>
                </div>
                <button class="delete-advisor" onclick="deleteAdvisor(${index})">Delete</button>
            </div>
            
            <!-- Preset Selector -->
            <div class="preset-section">
                <label class="preset-label">Role Preset</label>
                <select class="preset-select" onchange="applyPreset(${index}, this.value)">
                    <option value="custom">Custom Role</option>
                    <optgroup label="Government Ministries">
                        <option value="innovation">Minister of Innovation</option>
                        <option value="finance">Minister of Finance</option>
                        <option value="technology">Minister of Technology</option>
                        <option value="development">Minister of Development</option>
                        <option value="strategy">Minister of Strategy</option>
                        <option value="defense">Minister of Defense</option>
                        <option value="foreign_affairs">Minister of Foreign Affairs</option>
                        <option value="research">Minister of Research</option>
                        <option value="education">Minister of Education</option>
                        <option value="health">Minister of Health</option>
                        <option value="environment">Minister of Environment</option>
                    </optgroup>
                    <optgroup label="Leadership">
                        <option value="prime_minister">Prime Minister</option>
                    </optgroup>
                </select>
                <div class="preset-hint">Select a preset or customize below</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Name</label>
                <input 
                    type="text" 
                    class="form-input" 
                    value="${advisor.name}"
                    onchange="updateAdvisor(${index}, 'name', this.value)"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label">Role</label>
                <input 
                    type="text" 
                    class="form-input" 
                    value="${advisor.role}"
                    onchange="updateAdvisor(${index}, 'role', this.value)"
                >
            </div>
            
            <div class="form-group">
                <label class="form-label">Model</label>
                <select 
                    class="form-select"
                    onchange="updateAdvisor(${index}, 'model', this.value)"
                >
                    ${availableOllamaModels.map(m => 
                        `<option value="${m.name}" ${m.name === advisor.model ? 'selected' : ''}>
                            ${m.name} ${m.size_formatted ? `(${m.size_formatted})` : ''}
                        </option>`
                    ).join('')}
                </select>
                <div class="form-hint">Select which Ollama model to use for this advisor</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">System Prompt</label>
                <textarea 
                    class="form-textarea" 
                    onchange="updateAdvisor(${index}, 'personality', this.value)"
                >${advisor.personality}</textarea>
                <div class="form-hint">Define how this advisor thinks and responds</div>
            </div>
        </div>
    `).join('');
}

// Drag and Drop Functions
function handleDragStart(event, index) {
    draggedIndex = index;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.advisor-config').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedIndex = null;
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Add visual indicator
    const targetElement = event.currentTarget;
    if (!targetElement.classList.contains('dragging')) {
        targetElement.classList.add('drag-over');
    }
    
    return false;
}

function handleDrop(event, dropIndex) {
    event.stopPropagation();
    event.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        // Reorder the advisors array
        const draggedAdvisor = settings.advisors[draggedIndex];
        settings.advisors.splice(draggedIndex, 1);
        
        // Adjust drop index if needed
        const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
        settings.advisors.splice(newIndex, 0, draggedAdvisor);
        
        // Re-render
        renderAdvisorSettings();
    }
    
    return false;
}

function updateAdvisor(index, field, value) {
    settings.advisors[index][field] = value;
}

function deleteAdvisor(index) {
    if (settings.advisors.length <= 1) {
        alert('You must have at least one advisor!');
        return;
    }
    settings.advisors.splice(index, 1);
    renderAdvisorSettings();
}

function addAdvisor() {
    settings.advisors.push({
        name: 'New Advisor',
        role: 'Custom Role',
        model: availableOllamaModels[0]?.name || 'llama3.2:3b',
        personality: 'You are a helpful AI advisor. Provide thoughtful insights.'
    });
    renderAdvisorSettings();
}

function resetSettings() {
    if (confirm('Reset to default settings? This cannot be undone.')) {
        localStorage.removeItem('councilSettings');
        socket.emit('get_default_settings');
        socket.once('default_settings', (data) => {
            settings.advisors = data.advisors;
            settings.ollama_host = data.ollama_host;
            endpointInput.value = settings.ollama_host;
            renderAdvisorSettings();
        });
    }
}

function saveAndCloseSettings() {
    settings.ollama_host = endpointInput.value.trim();
    saveSettings();
    closeSettings();
    alert('Settings saved! They will take effect for your next question.');
}

socket.on('settings_updated', (data) => {
    if (!data.success) {
        alert('Error updating settings: ' + data.error);
    }
});

// Plus menu
function togglePlusMenu() {
    menuOpen = !menuOpen;
    plusMenu.classList.toggle('visible', menuOpen);
    plusButton.classList.toggle('active', menuOpen);
}

document.addEventListener('click', (e) => {
    if (menuOpen && !plusButton.contains(e.target) && !plusMenu.contains(e.target)) {
        togglePlusMenu();
    }
});

// Mode selection
function selectMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('.menu-btn[data-mode]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    if (mode === 'web_search') {
        modelSelectWrapper.classList.add('visible');
        toolsSection.style.display = 'none';
        questionInput.placeholder = 'Quick question (e.g., "Weather in London?")';
    } else if (mode === 'deep_research') {
        modelSelectWrapper.classList.remove('visible');
        toolsSection.style.display = 'none';
        questionInput.placeholder = 'Complex research question...';
    } else {
        modelSelectWrapper.classList.remove('visible');
        toolsSection.style.display = 'block';
        questionInput.placeholder = 'Ask your question...';
    }
}

// Tool toggle
function toggleTool(tool) {
    const checkbox = document.getElementById(`toggle-${tool}`);
    checkbox.checked = !checkbox.checked;
}

// File handling
function openFilePicker() {
    fileInput.click();
    togglePlusMenu();
}

function handleFileSelect(files) {
    if (files.length > 0) {
        const file = files[0];
        uploadFileToServer(file);
    }
}

function uploadFileToServer(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        socket.emit('upload_file', {
            file_name: file.name,
            file_data: e.target.result
        });
        progress.textContent = 'Uploading file...';
    };
    reader.readAsDataURL(file);
}

socket.on('file_uploaded', (data) => {
    if (data.success) {
        uploadedFile = data.file_path;
        fileNameSpan.textContent = data.file_name;
        fileAttachment.classList.add('visible');
        progress.textContent = '';
        document.getElementById('toggle-document').checked = true;
    } else {
        progress.textContent = 'File upload failed: ' + data.error;
    }
});

function removeFile() {
    uploadedFile = null;
    fileAttachment.classList.remove('visible');
    fileInput.value = '';
}

// Drag and drop
inputBoxWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    inputBoxWrapper.classList.add('drag-over');
});

inputBoxWrapper.addEventListener('dragleave', () => {
    inputBoxWrapper.classList.remove('drag-over');
});

inputBoxWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    inputBoxWrapper.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files);
    }
});

// Textarea auto-resize
questionInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        conveneCouncil();
    }
}

// Main chat function
// Main chat function
function conveneCouncil() {
    console.log('conveneCouncil called');  // Debug log
    
    const question = questionInput?.value?.trim();
    
    if (!question) {
        console.log('No question entered');
        return;
    }
    
    if (sendBtn?.disabled) {
        console.log('Send button is disabled');
        return;
    }
    
    console.log('Sending question:', question);  // Debug log
    
    const data = {
        question: question,
        mode: currentMode,
        uploaded_file: uploadedFile || null
    };
    
    if (currentMode === 'web_search') {
        data.selected_model = modelSelect?.value || '';
        console.log('Web search mode, model:', data.selected_model);
    } else if (currentMode === 'normal') {
        const docToggle = document.getElementById('toggle-document');
        const calcToggle = document.getElementById('toggle-calculator');
        
        data.tools = {
            document_reading: docToggle?.checked || false,
            calculator: calcToggle?.checked || false
        };
        console.log('Normal mode, tools:', data.tools);
    }
    
    console.log('Emitting convene_council event with data:', data);
    
    // Disable send button
    if (sendBtn) sendBtn.disabled = true;
    if (progress) progress.textContent = currentMode === 'deep_research' ? 
        'Starting deep research...' : 'Processing...';
    
    // Clear previous messages
    if (messagesDiv) messagesDiv.innerHTML = '';
    advisorElements = {};
    
    // Emit the event
    try {
        socket.emit('convene_council', data);
        console.log('Event emitted successfully');
    } catch (error) {
        console.error('Error emitting event:', error);
        if (progress) progress.textContent = 'Error: ' + error.message;
        if (sendBtn) sendBtn.disabled = false;
        return;
    }
    
    // Clear input
    if (questionInput) {
        questionInput.value = '';
        questionInput.style.height = 'auto';
    }
    
    // Remove file
    removeFile();
    
    // Close menu if open
    if (menuOpen) togglePlusMenu();
}



// Socket events
socket.on('council_message', (data) => {
    if (data.status === 'tool_info') {
        const toolDiv = document.createElement('div');
        toolDiv.className = 'tool-info-message';
        toolDiv.innerHTML = `
            <div class="tool-info-content">
                <span>🛠️</span>
                <span>${escapeHtml(data.content)}</span>
            </div>
        `;
        messagesDiv.appendChild(toolDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return;
    }
    
    if (!advisorElements[data.name]) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'advisor-message';
        msgDiv.id = `advisor-${data.name}`;
        
        const initial = data.name.charAt(0).toUpperCase();
        
        // Render content as markdown
        const isThinking = data.status === 'thinking';
        const renderedContent = isThinking ? escapeHtml(data.content) : renderMarkdown(data.content);
        
        msgDiv.innerHTML = `
            <div class="advisor-content">
                <div class="advisor-avatar">${initial}</div>
                <div class="advisor-body">
                    <div class="advisor-header">
                        <span class="advisor-name">${escapeHtml(data.name)}</span>
                        <span class="advisor-role">${escapeHtml(data.role)}</span>
                    </div>
                    <div class="advisor-response ${isThinking ? 'thinking' : ''}" id="response-${data.name}">
                        ${renderedContent}
                    </div>
                </div>
            </div>
        `;
        
        messagesDiv.appendChild(msgDiv);
        advisorElements[data.name] = msgDiv;
    } else {
        const responseDiv = document.getElementById(`response-${data.name}`);
        
        if (data.status === 'thinking') {
            responseDiv.textContent = data.content;
            responseDiv.className = 'advisor-response thinking';
        } else {
            responseDiv.innerHTML = renderMarkdown(data.content);
            responseDiv.className = 'advisor-response';
        }
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
});


socket.on('council_complete', (data) => {
    progress.textContent = '';
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-message';
    statusDiv.textContent = '✓ Discussion complete';
    messagesDiv.appendChild(statusDiv);
    sendBtn.disabled = false;
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('council_error', (data) => {
    progress.textContent = 'Error: ' + data.error;
    sendBtn.disabled = false;
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
