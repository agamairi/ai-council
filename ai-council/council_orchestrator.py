import ollama
from ollama import Client
from tools import CouncilTools
import re

class AICouncil:
    def __init__(self, ollama_host='http://localhost:11434'):
        self.ollama_host = ollama_host
        self.client = Client(host=ollama_host)
        self.tools = CouncilTools()
        
        # Ministry-themed role templates
        self.ministry_roles = [
            {
                'ministry': 'Innovation',
                'title': 'Minister of Innovation',
                'personality': 'You are the Minister of Innovation. Think outside the box and propose innovative, unconventional solutions. Focus on cutting-edge approaches and creative thinking. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Finance',
                'title': 'Minister of Finance',
                'personality': 'You are the Minister of Finance. Provide logical, quantitative analysis and data-driven insights. Focus on costs, benefits, and economic implications. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Technology',
                'title': 'Minister of Technology',
                'personality': 'You are the Minister of Technology. Provide technical and scientific expertise. Focus on technical feasibility, implementation details, and engineering challenges. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Development',
                'title': 'Minister of Development',
                'personality': 'You are the Minister of Development. Evaluate technical implementation approaches and provide concrete execution strategies. Focus on practical building and deployment. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Strategy',
                'title': 'Minister of Strategy',
                'personality': 'You are the Minister of Strategy. Focus on practical implementation, risk assessment, and feasibility. Consider long-term implications and strategic planning. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Defense',
                'title': 'Minister of Defense',
                'personality': 'You are the Minister of Defense. Identify risks, security concerns, and potential threats. Focus on protection, mitigation strategies, and defensive measures. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Foreign Affairs',
                'title': 'Minister of Foreign Affairs',
                'personality': 'You are the Minister of Foreign Affairs. Consider external perspectives, international implications, and cross-cultural factors. Focus on diplomacy and global context. Be brief (2-3 sentences).'
            },
            {
                'ministry': 'Research',
                'title': 'Minister of Research',
                'personality': 'You are the Minister of Research. Provide evidence-based analysis, scientific reasoning, and data-driven insights. Focus on facts, studies, and empirical evidence. Be brief (2-3 sentences).'
            }
        ]
        
        # Auto-detect and assign models (will be populated on first load)
        self.default_advisors = []
        self.advisors = []
        
        # Try to auto-populate
        self.auto_assign_models()

    def auto_assign_models(self):
        """Auto-detect available models and assign them to ministries"""
        try:
            available = self.get_available_models()
            
            if not available or len(available) == 0:
                print("No models detected. Using empty advisor list.")
                self.default_advisors = []
                self.advisors = []
                return
            
            # Sort models by size (prefer larger models for better quality)
            available.sort(key=lambda x: x.get('size', 0), reverse=True)
            
            # Assign up to 5 models + 1 Prime Minister
            num_ministers = min(5, len(available))
            
            advisors = []
            
            # Assign regular ministers
            for i in range(num_ministers):
                ministry = self.ministry_roles[i % len(self.ministry_roles)]
                advisors.append({
                    'name': ministry['title'],
                    'role': ministry['title'],
                    'model': available[i]['name'],
                    'personality': ministry['personality']
                })
            
            # Always add Prime Minister (synthesizer) at the end
            pm_model = available[0]['name'] if num_ministers < len(available) else available[-1]['name']
            advisors.append({
                'name': 'Prime Minister',
                'role': 'Chief Executive & Synthesizer',
                'model': pm_model,
                'personality': 'You are the Prime Minister. Synthesize all ministerial perspectives, identify consensus, and provide final balanced recommendations. Lead with decisive conclusions. Be concise (3-4 sentences).'
            })
            
            self.default_advisors = advisors
            self.advisors = advisors.copy()
            
            print(f"✓ Auto-assigned {len(advisors)} advisors to available models")
            
        except Exception as e:
            print(f"Error auto-assigning models: {e}")
            # Fallback to empty list
            self.default_advisors = []
            self.advisors = []

    
    def set_ollama_host(self, host):
        """Update Ollama host endpoint"""
        self.ollama_host = host
        self.client = Client(host=host)
    
    def update_advisors(self, custom_advisors):
        """Update advisors with custom configurations"""
        self.advisors = custom_advisors if custom_advisors else self.default_advisors.copy()
    
    def get_available_models(self):
        """Get list of all available Ollama models from the server"""
        try:
            models_response = self.client.list()
            models = []
            
            for model in models_response.get('models', []):
                name = model.get('name', model.get('model', 'unknown'))
                size = model.get('size', 0)
                modified = model.get('modified_at', '')
                
                # Convert datetime to string if needed
                if modified and hasattr(modified, 'isoformat'):
                    modified = modified.isoformat()
                elif modified:
                    modified = str(modified)
                
                # Format size
                size_gb = size / (1024**3) if size > 0 else 0
                size_str = f"{size_gb:.1f} GB" if size_gb > 0 else "Unknown"
                
                models.append({
                    'name': name,
                    'size': size,
                    'size_formatted': size_str,
                    'modified': modified
                })
            
            return models
        except Exception as e:
            print(f"Error fetching models: {e}")
            # Return default models as fallback
            return [{'name': a['model'], 'size': 0, 'size_formatted': 'Unknown', 'modified': ''} 
                    for a in self.default_advisors]

    
    def test_connection(self):
        """Test if Ollama server is reachable"""
        try:
            self.client.list()
            return True, "Connected successfully"
        except Exception as e:
            return False, str(e)
    
    def web_search_mode(self, question, selected_model, callback=None):
        """Single model performs web search and answers"""
        advisor = next((a for a in self.advisors if a['model'] == selected_model), self.advisors[0])
        
        if callback:
            callback({
                'name': 'System',
                'role': 'Web Search',
                'content': f'🔍 {advisor["name"]} is searching the web...',
                'status': 'tool_info'
            })
        
        search_results = self.tools.web_search(question, max_results=5)
        
        if callback:
            callback({
                'name': advisor['name'],
                'role': advisor['role'],
                'content': 'Analyzing search results...',
                'status': 'thinking'
            })
        
        enhanced_question = f"{question}\n\n**Web Search Results:**\n{search_results}\n\nBased on these search results, provide a comprehensive answer."
        
        messages = [
            {'role': 'system', 'content': f"{advisor['personality']} You have access to web search results. Provide a detailed, well-informed answer (4-5 sentences)."},
            {'role': 'user', 'content': enhanced_question}
        ]
        
        try:
            response = self.client.chat(
                model=advisor['model'],
                messages=messages,
                options={'temperature': 0.7, 'num_predict': 250}
            )
            
            answer = response['message']['content'].strip()
            if not answer:
                answer = "I couldn't generate a response based on the search results."
            
            if callback:
                callback({
                    'name': advisor['name'],
                    'role': advisor['role'],
                    'content': answer,
                    'status': 'complete'
                })
            
            return [{'advisor': advisor['name'], 'role': advisor['role'], 'response': answer}]
            
        except Exception as e:
            error_msg = f"Unable to respond: {str(e)}"
            if callback:
                callback({
                    'name': advisor['name'],
                    'role': advisor['role'],
                    'content': error_msg,
                    'status': 'error'
                })
            return [{'advisor': advisor['name'], 'role': advisor['role'], 'response': error_msg}]
    
    def deep_research_mode(self, question, callback=None):
        """All models independently search and provide opinions"""
        if callback:
            callback({
                'name': 'System',
                'role': 'Deep Research',
                'content': '🔬 Initiating deep research mode - all advisors will search independently...',
                'status': 'tool_info'
            })
        
        all_responses = []
        
        for advisor in self.advisors:
            if callback:
                callback({
                    'name': advisor['name'],
                    'role': advisor['role'],
                    'content': 'Searching the web...',
                    'status': 'thinking'
                })
            
            search_results = self.tools.web_search(question, max_results=3)
            
            if callback:
                callback({
                    'name': advisor['name'],
                    'role': advisor['role'],
                    'content': 'Analyzing findings...',
                    'status': 'thinking'
                })
            
            enhanced_question = f"{question}\n\n**Your Research Findings:**\n{search_results}\n\nBased on your research, provide your unique perspective."
            
            messages = [
                {'role': 'system', 'content': advisor['personality']},
                {'role': 'user', 'content': enhanced_question}
            ]
            
            try:
                response = self.client.chat(
                    model=advisor['model'],
                    messages=messages,
                    options={'temperature': 0.7, 'num_predict': 200}
                )
                
                advisor_response = response['message']['content'].strip()
                if not advisor_response:
                    advisor_response = "I need more time to analyze the research."
                
                if callback:
                    callback({
                        'name': advisor['name'],
                        'role': advisor['role'],
                        'content': advisor_response,
                        'status': 'complete'
                    })
                
                all_responses.append({
                    'advisor': advisor['name'],
                    'role': advisor['role'],
                    'response': advisor_response
                })
                
            except Exception as e:
                error_msg = f"Research error: {str(e)}"
                if callback:
                    callback({
                        'name': advisor['name'],
                        'role': advisor['role'],
                        'content': error_msg,
                        'status': 'error'
                    })
        
        return all_responses
    
    def convene_council(self, question, callback=None, mode='normal', selected_model=None, enabled_tools=None):
        """Main method to run council in different modes"""
        if mode == 'web_search':
            return self.web_search_mode(question, selected_model, callback)
        elif mode == 'deep_research':
            return self.deep_research_mode(question, callback)
        else:
            return self._normal_mode(question, callback, enabled_tools or {})
    
    def _normal_mode(self, question, callback, enabled_tools):
        """Original council mode with optional tools"""
        tool_results = {}
        
        if enabled_tools.get('document_reading', False):
            file_patterns = [
                r'["\']([^"\']+\.(?:pdf|docx|txt|doc))["\']',
                r'(?:read|analyze|summarize)\s+([^\s]+\.(?:pdf|docx|txt))',
                r'((?:\/|\.\/|~\/)[^\s]+\.(?:pdf|docx|txt))'
            ]
            
            for pattern in file_patterns:
                matches = re.findall(pattern, question, re.IGNORECASE)
                if matches:
                    file_path = matches[0]
                    tool_results['document'] = self.tools.read_document(file_path)
                    
                    if callback:
                        callback({
                            'name': 'System',
                            'role': 'Tools',
                            'content': f'📄 Document read: {file_path}',
                            'status': 'tool_info'
                        })
                    break
        
        if enabled_tools.get('calculator', False):
            math_pattern = r'(\d+[\s\+\-\*/\^\(\)\.]+[\d\s\+\-\*/\^\(\)\.]+\d+)'
            match = re.search(math_pattern, question)
            if match:
                expression = match.group(1).strip()
                tool_results['calculation'] = self.tools.calculate(expression)
                
                if callback:
                    callback({
                        'name': 'System',
                        'role': 'Tools',
                        'content': f'🧮 {tool_results["calculation"]}',
                        'status': 'tool_info'
                    })
        
        enhanced_question = question
        if tool_results:
            enhanced_question += "\n\n**Additional Information:**\n"
            for tool_name, result in tool_results.items():
                truncated_result = result[:2000] + "..." if len(result) > 2000 else result
                enhanced_question += f"\n{truncated_result}\n"
        
        all_responses = []
        previous_opinions = ""
        
        for idx, advisor in enumerate(self.advisors):
            if callback:
                callback({
                    'name': advisor['name'],
                    'role': advisor['role'],
                    'content': 'Thinking...',
                    'status': 'thinking'
                })
            
            if idx == 0:
                user_message = f"Question: {enhanced_question}\n\nProvide your perspective."
            else:
                user_message = f"Question: {enhanced_question}\n\nPrevious advisors:\n{previous_opinions}\n\nYour unique perspective:"
            
            messages = [
                {'role': 'system', 'content': advisor['personality']},
                {'role': 'user', 'content': user_message}
            ]
            
            try:
                response = self.client.chat(
                    model=advisor['model'],
                    messages=messages,
                    options={'temperature': 0.7}
                )
                
                advisor_response = response['message']['content'].strip()
                if not advisor_response:
                    advisor_response = "I need more time to consider this."
                
                previous_opinions += f"\n{advisor['name']}: {advisor_response}\n"
                
                if callback:
                    callback({
                        'name': advisor['name'],
                        'role': advisor['role'],
                        'content': advisor_response,
                        'status': 'complete'
                    })
                
                all_responses.append({
                    'advisor': advisor['name'],
                    'role': advisor['role'],
                    'response': advisor_response
                })
                
            except Exception as e:
                error_msg = f"Unable to respond."
                if callback:
                    callback({
                        'name': advisor['name'],
                        'role': advisor['role'],
                        'content': error_msg,
                        'status': 'error'
                    })
        
        return all_responses
