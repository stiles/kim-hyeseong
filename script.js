let voices = [];
let currentUtterance = null;
let modelsVisible = false;

// Name alternating functionality
let isKoreanOrder = true;

function alternateName() {
    const nameElement = document.getElementById('alternating-name');
    const indicatorElement = document.getElementById('name-order-indicator');
    
    if (!nameElement || !indicatorElement) return;
    
    // Add fade effect
    nameElement.classList.add('fade');
    indicatorElement.classList.add('fade');
    
    setTimeout(() => {
        if (isKoreanOrder) {
            nameElement.textContent = 'Hyeseong Kim?';
            indicatorElement.textContent = 'English name order (given, family)';
        } else {
            nameElement.textContent = 'Kim Hye-seong?';
            indicatorElement.textContent = 'Korean name order (family, given)';
        }
        
        isKoreanOrder = !isKoreanOrder;
        
        // Remove fade effect after a brief delay
        setTimeout(() => {
            nameElement.classList.remove('fade');
            indicatorElement.classList.remove('fade');
        }, 50);
    }, 150);
}

function startNameAlternation() {
    // Start alternating after 3 seconds, then every 4 seconds
    setTimeout(() => {
        alternateName();
        setInterval(alternateName, 4000);
    }, 3000);
}

function toggleModels() {
    const section = document.getElementById('models-section');
    const toggleText = document.getElementById('toggle-text');
    
    modelsVisible = !modelsVisible;
    
    if (modelsVisible) {
        section.classList.add('show');
        toggleText.textContent = 'Hide individual AI model variations';
    } else {
        section.classList.remove('show');
        toggleText.textContent = 'See individual AI model variations';
    }
}

function initializeSpeech() {
    if ('speechSynthesis' in window) {
        voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            speechSynthesis.onvoiceschanged = () => {
                voices = speechSynthesis.getVoices();
            };
        }
    }
}

function stopCurrentSpeech() {
    if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
        document.querySelectorAll('.audio-btn').forEach(btn => {
            btn.classList.remove('playing');
            btn.disabled = false;
        });
    }
}

function speak(text, language = 'ko-KR', button = null) {
    if (!('speechSynthesis' in window)) {
        alert('Speech synthesis not supported in this browser.');
        return;
    }

    stopCurrentSpeech();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Default to Yuna voice for Korean, then fall back to any Korean voice
    if (language.includes('ko')) {
        const yunaVoice = voices.find(voice => voice.name.includes('Yuna'));
        const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
        
        if (yunaVoice) {
            utterance.voice = yunaVoice;
        } else if (koreanVoice) {
            utterance.voice = koreanVoice;
        }
    }
    
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    if (button) {
        button.classList.add('playing');
        button.disabled = true;
    }
    
    utterance.onend = () => {
        if (button) {
            button.classList.remove('playing');
            button.disabled = false;
        }
        currentUtterance = null;
    };
    
    utterance.onerror = () => {
        if (button) {
            button.classList.remove('playing');
            button.disabled = false;
        }
        currentUtterance = null;
    };
    
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

async function loadPronunciations() {
    try {
        const response = await fetch('pronounciations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayModels(data);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'grid';
        
        // Start name alternation after content loads
        startNameAlternation();
    } catch (error) {
        console.error('Error loading pronunciations:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Error loading pronunciation data. Please make sure the pronounciations.json file is accessible.';
    }
}

function displayModels(pronunciations) {
    const container = document.getElementById('models-grid');
    container.innerHTML = '';

    pronunciations.forEach(pronunciation => {
        const card = createModelCard(pronunciation);
        container.appendChild(card);
    });
}

function createModelCard(pronunciation) {
    const card = document.createElement('div');
    card.className = 'model-card';

    card.innerHTML = `
        <div class="model-name">${pronunciation.model}</div>
        <div class="model-explanation">${pronunciation.pronunciation_explanation}</div>
        <div class="model-syllables">
            ${pronunciation.syllable_breakdown.map(syllable => 
                `<span class="syllable-item"><strong>${syllable.hangul}</strong> → ${syllable.pronounced_as}</span>`
            ).join(' • ')}
        </div>
    `;

    return card;
}

// Load pronunciations when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPronunciations();
    initializeSpeech();
}); 