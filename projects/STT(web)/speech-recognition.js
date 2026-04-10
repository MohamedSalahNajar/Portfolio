// Speech Recognition Setup
let recognition;
let isListening = false;
let currentLanguage = 'fr-FR'; // Start with French
let finalTranscript = '';
let interimTranscript = '';

// Check browser support
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    alert('Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.');
}

if (recognition) {
    // Configure recognition
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show results as you speak
    recognition.lang = currentLanguage; // French by default
    recognition.maxAlternatives = 1;

    // Event: Recognition starts
    recognition.onstart = () => {
        isListening = true;
        updateUI('listening');
        console.log('🎤 Reconnaissance vocale démarrée');
    };

    // Event: Recognition ends
    recognition.onend = () => {
        if (isListening) {
            // Auto-restart if manually stopped
            recognition.start();
        } else {
            updateUI('stopped');
            console.log('🛑 Reconnaissance vocale arrêtée');
        }
    };

    // Event: Results received
    recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
                addToHistory(transcript, confidence);
                updateConfidence(confidence * 100);
            } else {
                interimTranscript += transcript;
            }
        }
        
        updateSubtitles();
    };

    // Event: Error handling
    recognition.onerror = (event) => {
        console.error('Erreur de reconnaissance:', event.error);
        
        let errorMessage = 'Erreur: ';
        switch (event.error) {
            case 'no-speech':
                errorMessage += 'Aucun son détecté';
                break;
            case 'audio-capture':
                errorMessage += 'Microphone non accessible';
                break;
            case 'not-allowed':
                errorMessage += 'Permission microphone refusée';
                break;
            default:
                errorMessage += event.error;
        }
        
        updateStatus(errorMessage, 'error');
        
        // Auto-restart on network errors
        if (event.error === 'network') {
            setTimeout(() => {
                if (isListening) {
                    recognition.start();
                }
            }, 2000);
        }
    };
}

// Toggle recognition on/off
function toggleRecognition() {
    if (!recognition) {
        alert('Reconnaissance vocale non supportée');
        return;
    }
    
    if (isListening) {
        stopRecognition();
    } else {
        startRecognition();
    }
}

// Start recognition
function startRecognition() {
    try {
        recognition.start();
        isListening = true;
        updateUI('listening');
        updateStatus('En écoute...', 'listening');
    } catch (error) {
        console.error('Erreur au démarrage:', error);
    }
}

// Stop recognition
function stopRecognition() {
    recognition.stop();
    isListening = false;
    updateUI('stopped');
    updateStatus('Arrêté', 'stopped');
}

// Update subtitles display
function updateSubtitles() {
    const subtitleElement = document.getElementById('subtitleText');
    const displayText = (finalTranscript + interimTranscript).trim();
    
    if (displayText) {
        subtitleElement.textContent = displayText;
        
        // Add interim class for non-final text
        if (interimTranscript) {
            subtitleElement.classList.add('interim');
        } else {
            subtitleElement.classList.remove('interim');
        }
    } else {
        subtitleElement.textContent = 'Parlez maintenant...';
    }
}

// Update UI based on state
function updateUI(state) {
    const startBtn = document.getElementById('startBtn');
    const btnText = document.getElementById('btnText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (state === 'listening') {
        startBtn.classList.add('active');
        btnText.textContent = 'Arrêter';
        statusIndicator.classList.add('listening');
        statusIndicator.classList.remove('error');
    } else if (state === 'stopped') {
        startBtn.classList.remove('active');
        btnText.textContent = 'Démarrer';
        statusIndicator.classList.remove('listening', 'error');
    }
}

// Update status message
function updateStatus(message, type = 'normal') {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    statusText.textContent = message;
    
    if (type === 'error') {
        statusIndicator.classList.add('error');
        statusIndicator.classList.remove('listening');
    } else if (type === 'listening') {
        statusIndicator.classList.add('listening');
        statusIndicator.classList.remove('error');
    } else {
        statusIndicator.classList.remove('listening', 'error');
    }
}

// Update confidence bar
function updateConfidence(percentage) {
    const confidenceFill = document.getElementById('confidenceFill');
    confidenceFill.style.width = percentage + '%';
    
    // Reset after 2 seconds
    setTimeout(() => {
        confidenceFill.style.width = '0%';
    }, 2000);
}

// Add to history
function addToHistory(text, confidence) {
    const historyContent = document.getElementById('historyContent');
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    
    const timestamp = new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const confidencePercent = Math.round(confidence * 100);
    
    entry.innerHTML = `
        <div class="history-timestamp">${timestamp} • ${confidencePercent}% confiance</div>
        <div>${text}</div>
    `;
    
    historyContent.insertBefore(entry, historyContent.firstChild);
    
    // Limit history to 20 entries
    while (historyContent.children.length > 20) {
        historyContent.removeChild(historyContent.lastChild);
    }
    
    // Auto-scroll if enabled
    if (document.getElementById('autoScroll').checked) {
        historyContent.scrollTop = 0;
    }
}

// Toggle language between French and English
function toggleLanguage() {
    const wasListening = isListening;
    
    if (wasListening) {
        stopRecognition();
    }
    
    if (currentLanguage === 'fr-FR') {
        currentLanguage = 'en-US';
        recognition.lang = 'en-US';
        updateLanguageBadge('🇬🇧', 'English');
        document.getElementById('langBtnText').textContent = '🇬🇧 → 🇫🇷';
        console.log('Switched to English');
    } else {
        currentLanguage = 'fr-FR';
        recognition.lang = 'fr-FR';
        updateLanguageBadge('🇫🇷', 'Français');
        document.getElementById('langBtnText').textContent = '🇫🇷 → 🇬🇧';
        console.log('Basculé en français');
    }
    
    if (wasListening) {
        setTimeout(() => startRecognition(), 500);
    }
}

// Update language badge
function updateLanguageBadge(flag, text) {
    const badge = document.getElementById('languageBadge');
    badge.innerHTML = `
        <span class="flag">${flag}</span>
        <span class="lang-text">${text}</span>
    `;
}

// Clear transcript
function clearTranscript() {
    finalTranscript = '';
    interimTranscript = '';
    document.getElementById('subtitleText').textContent = 'Appuyez sur le bouton pour commencer...';
    updateStatus('Prêt à écouter', 'normal');
}

// Toggle history panel
function toggleHistory() {
    const history = document.getElementById('transcriptHistory');
    const btn = history.querySelector('.minimize-btn');
    
    if (history.style.display === 'none') {
        history.style.display = 'block';
        btn.textContent = '−';
    } else {
        history.style.display = 'none';
        btn.textContent = '+';
    }
}

// Toggle settings panel
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
}

// Toggle info panel
function toggleInfo() {
    const panel = document.getElementById('infoPanel');
    panel.classList.toggle('active');
}

// Update text size
function updateTextSize(size) {
    const subtitleText = document.getElementById('subtitleText');
    subtitleText.style.fontSize = size + 'px';
}

// Update transparency
function updateTransparency(value) {
    const container = document.querySelector('.subtitle-container');
    const opacity = value / 100;
    container.style.background = `rgba(0, 0, 0, ${opacity * 0.8})`;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space to toggle recording
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleRecognition();
    }
    
    // L to toggle language
    if (e.key === 'l' || e.key === 'L') {
        toggleLanguage();
    }
    
    // C to clear
    if (e.key === 'c' || e.key === 'C') {
        clearTranscript();
    }
    
    // Escape to stop
    if (e.key === 'Escape') {
        if (isListening) {
            stopRecognition();
        }
    }
    
    // I for info
    if (e.key === 'i' || e.key === 'I') {
        toggleInfo();
    }
});

// Request microphone permission on load
window.addEventListener('load', () => {
    // Check if we have permission
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' })
            .then((permissionStatus) => {
                if (permissionStatus.state === 'granted') {
                    console.log('✅ Permission microphone accordée');
                } else if (permissionStatus.state === 'prompt') {
                    console.log('⚠️ Permission microphone sera demandée');
                } else {
                    console.log('❌ Permission microphone refusée');
                    updateStatus('Permission microphone requise', 'error');
                }
            })
            .catch(err => {
                console.log('Permission query non supportée');
            });
    }
    
    // Show welcome message
    setTimeout(() => {
        console.log(`
🎤 AR Glasses Speech-to-Text Prototype
═══════════════════════════════════════
✓ Support: Français & English
✓ Reconnaissance en temps réel
✓ Sous-titres style AR glasses

Raccourcis clavier:
• ESPACE: Démarrer/Arrêter
• L: Changer langue
• C: Effacer
• I: Informations
• ESC: Arrêter

Prêt à commencer! 🚀
        `);
    }, 1000);
});

// Handle page visibility (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isListening) {
        // Optionally pause when tab is hidden
        console.log('Tab cachée - reconnaissance continue');
    }
});

console.log('🎤 Speech Recognition Module Loaded');
console.log('Language:', currentLanguage);
console.log('Browser support:', !!recognition);
