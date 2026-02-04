const API_KEY = 'v1-Z0FBQUFBQm5HUEtMSjJkakVjcF9IQ0M0VFhRQ0FmSnNDSHNYTlJSblE0UXo1Q3RBcjFPcl9YYy1OZUhteDZWekxHdWRLM1M1alNZTkJMWEhNOWd4S1NPSDBTWC12M0U2UGc9PQ==';
const LLM_API_URL = `https://backend.buildpicoapps.com/aero/run/llm-api?pk=${API_KEY}`;

// DOM Elements
const userPromptInput = document.getElementById('userPrompt');
const segmentLengthSelect = document.getElementById('segmentLength');
const totalTimeSpan = document.getElementById('totalTime');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const promptsContainer = document.getElementById('promptsContainer');
const copyAllBtn = document.getElementById('copyAllBtn');
const resetBtn = document.getElementById('resetBtn');

let generatedPrompts = [];

// Update total video time
segmentLengthSelect.addEventListener('change', updateTotalTime);

function updateTotalTime() {
    const segmentLength = parseInt(segmentLengthSelect.value);
    const totalSeconds = segmentLength * 4; // Always 4 segments
    totalTimeSpan.textContent = `${totalSeconds} seconds`;
}

// System prompt for prompt generation
const SYSTEM_PROMPT = `You are a professional Sora 2 AI video generation expert.
Generate 4 video segment prompts with continuity from the user's input.

## Important Rules:
1. Generate exactly 4 segments
2. Each segment must be the specified duration
3. Prioritize continuity: Segment k (k>1) must begin exactly at the final frame of segment k-1
4. Maintain consistent visual style, tone, lighting, and subject identity
5. Avoid real people, copyrighted characters, and trademark logos
6. Describe camera, lighting, motion, and subjects specifically

## Output Format (must follow):
Segment 1:
[Prompt text]

Segment 2:
Context: [Explain continuity from previous segment]
Prompt: [Prompt text]

Segment 3:
Context: [Explain continuity from previous segment]
Prompt: [Prompt text]

Segment 4:
Context: [Explain continuity from previous segment]
Prompt: [Prompt text]

Generate 4 continuous prompts based on the user's input.`;

// API Call
async function callLLMAPI(userMessage) {
    try {
        const response = await fetch(LLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // デバッグ用にレスポンスをコンソールに出力
        console.log('API Response:', data);
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Generate prompts
async function generatePrompts() {
    const basePrompt = userPromptInput.value.trim();
    
    if (!basePrompt) {
        alert('Please enter your video idea');
        return;
    }

    const segmentLength = segmentLengthSelect.value;
    
    // Update UI
    generateBtn.disabled = true;
    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    try {
        const userMessage = `${SYSTEM_PROMPT}

User Input:
Base Prompt: ${basePrompt}
Segment Length: ${segmentLength} seconds
Number of Segments: 4

Generate 4 prompts in the format above.`;

        const data = await callLLMAPI(userMessage);
        
        // より柔軟なレスポンス処理
        if (data && (data.status === 'success' || data.text || data.response || data.output)) {
            const responseText = data.text || data.response || data.output || '';
            
            if (responseText) {
                parseAndDisplayPrompts(responseText, segmentLength);
            } else {
                throw new Error('Empty response from API');
            }
        } else {
            console.error('Unexpected API response:', data);
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Generation Error:', error);
        alert(`An error occurred: ${error.message}\n\nPlease check the console for details and try again.`);
    } finally {
        generateBtn.disabled = false;
        loadingSection.classList.add('hidden');
    }
}

// Parse and display prompts
function parseAndDisplayPrompts(text, segmentLength) {
    generatedPrompts = [];
    
    console.log('Parsing text:', text);
    
    // 複数の分割方法を試す
    let segments = text.split(/Segment\s*[1-4]:/gi).filter(s => s.trim());
    
    // 分割できない場合は段落で分割
    if (segments.length < 4) {
        segments = text.split(/\n\n+/).filter(s => s.trim());
    }
    
    // それでも足りない場合は文章を4等分
    if (segments.length < 4) {
        const lines = text.split('\n').filter(s => s.trim());
        const chunkSize = Math.ceil(lines.length / 4);
        segments = [];
        for (let i = 0; i < 4; i++) {
            const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize).join('\n');
            if (chunk) segments.push(chunk);
        }
    }
    
    // 最大4セグメントを作成
    generatedPrompts = segments.slice(0, 4).map((segment, index) => {
        // Context部分を削除してPromptのみを抽出
        const promptMatch = segment.match(/Prompt:\s*([\s\S]*?)(?=\n\nSegment|$)/i);
        const cleanPrompt = promptMatch ? promptMatch[1].trim() : segment.trim();
        
        return {
            title: `Segment ${index + 1}`,
            seconds: parseInt(segmentLength),
            prompt: cleanPrompt
        };
    });
    
    // 4セグメント未満の場合は警告
    if (generatedPrompts.length < 4) {
        console.warn(`Only ${generatedPrompts.length} segments generated`);
    }
    
    console.log('Generated prompts:', generatedPrompts);
    
    if (generatedPrompts.length > 0) {
        displayPrompts();
    } else {
        throw new Error('Failed to parse prompts from response');
    }
}

// Display prompts
function displayPrompts() {
    promptsContainer.innerHTML = '';
    
    generatedPrompts.forEach((prompt, index) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        
        card.innerHTML = `
            <div class="prompt-header">
                <div class="prompt-title">${prompt.title}</div>
                <div class="prompt-duration">${prompt.seconds}s</div>
            </div>
            <div class="prompt-text">${prompt.prompt}</div>
            <button class="copy-btn" data-index="${index}">Copy</button>
        `;
        
        promptsContainer.appendChild(card);
    });

    // Add event listeners to copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            copyPrompt(index, e.target);
        });
    });

    resultSection.classList.remove('hidden');
}

// Copy individual prompt
function copyPrompt(index, button) {
    const text = generatedPrompts[index].prompt;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    });
}

// Copy all prompts
function copyAllPrompts() {
    const allText = generatedPrompts.map((p, i) => 
        `=== ${p.title} (${p.seconds}s) ===\n${p.prompt}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(allText).then(() => {
        const originalText = copyAllBtn.textContent;
        copyAllBtn.textContent = 'All Copied';
        
        setTimeout(() => {
            copyAllBtn.textContent = originalText;
        }, 2000);
    });
}

// Reset
function reset() {
    userPromptInput.value = '';
    generatedPrompts = [];
    resultSection.classList.add('hidden');
}

// Event Listeners
generateBtn.addEventListener('click', generatePrompts);
copyAllBtn.addEventListener('click', copyAllPrompts);
resetBtn.addEventListener('click', reset);

// Initialize
updateTotalTime();