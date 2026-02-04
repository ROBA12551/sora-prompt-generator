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
1. Generate exactly **4 segments**
2. Each segment must be the specified duration
3. **Prioritize continuity**: Segment k (k>1) must begin exactly at the final frame of segment k-1
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

## Example:
User Input: "iPhone 19 intro video"
Segment Length: 6 seconds

Segment 1:
First shot introducing the new iPhone 19. Initially, the screen is completely dark. The phone, positioned vertically and facing directly forward, emerges slowly and dramatically out of darkness, gradually illuminated from the center of the screen outward, showcasing a vibrant, colorful, dynamic wallpaper on its edge-to-edge glass display. The style is futuristic, sleek, and premium, appropriate for an official Apple product reveal.

Segment 2:
Context: Previous scene ended with the phone facing directly forward, clearly displaying its vibrant front screen and colorful wallpaper.
Prompt: Second shot begins exactly from the final frame of the previous scene, showing the front of the iPhone 19 with its vibrant, colorful display clearly visible. Now, smoothly rotate the phone horizontally, turning it from the front to reveal the back side. Focus specifically on the advanced triple-lens camera module, clearly highlighting its premium materials, reflective metallic surfaces, and detailed lenses. Maintain consistent dramatic lighting, sleek visual style, and luxurious feel matching the official Apple product introduction theme.

Segment 3:
Context: Previous scene ended clearly showing the back of the iPhone 19, focusing specifically on its advanced triple-lens camera module.
Prompt: Third shot begins exactly from the final frame of the previous scene, clearly displaying the back side of the iPhone 19, with special emphasis on the triple-lens camera module. Now, have a user's hand gently pick up the phone, naturally rotating it from the back to the front and bringing it upward toward their face. Maintain consistent premium style.

Segment 4:
Context: Previous scene ended with user holding the phone toward their face.
Prompt: Final shot begins exactly from the final frame of the previous scene. Clearly show the phone smoothly and quickly unlocking via Face ID recognition, transitioning immediately to a vibrant home screen filled with updated app icons. Finish the scene by subtly fading the home screen into the iconic Apple logo. Keep the visual style consistent, premium, and elegant, suitable for an official Apple product launch.

Your turn. Generate 4 continuous prompts based on the user's input.`;

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

## User Input:
Base Prompt: ${basePrompt}
Segment Length: ${segmentLength} seconds
Number of Segments: 4

Generate 4 prompts in the format above.`;

        const data = await callLLMAPI(userMessage);
        
        if (data.status === 'success' && data.text) {
            parseAndDisplayPrompts(data.text, segmentLength);
        } else {
            throw new Error('Failed to generate prompts');
        }
    } catch (error) {
        alert('An error occurred. Please try again.');
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        loadingSection.classList.add('hidden');
    }
}

// Parse and display prompts
function parseAndDisplayPrompts(text, segmentLength) {
    generatedPrompts = [];
    
    // Split by segment markers
    const segments = text.split(/Segment\s*[1-4]:/i).filter(s => s.trim());
    
    if (segments.length < 4) {
        // Fallback: split by double newlines
        const lines = text.split('\n\n').filter(s => s.trim());
        generatedPrompts = lines.slice(0, 4).map((prompt, index) => ({
            title: `Segment ${index + 1}`,
            seconds: parseInt(segmentLength),
            prompt: prompt.trim()
        }));
    } else {
        generatedPrompts = segments.slice(0, 4).map((segment, index) => ({
            title: `Segment ${index + 1}`,
            seconds: parseInt(segmentLength),
            prompt: segment.trim()
        }));
    }

    displayPrompts();
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