// Sound effects using Web Audio API + Speech Synthesis for voice feedback
// Fixed: Audio distortion on laptops by using proper gain scheduling,
// lower volumes, compressor node, and better voice selection

const AudioCtx = window.AudioContext || window.webkitAudioContext
let audioCtx = null
let compressor = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioCtx({ sampleRate: 44100 })
    // Master compressor prevents clipping/distortion on laptop speakers
    compressor = audioCtx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-24, audioCtx.currentTime)
    compressor.knee.setValueAtTime(30, audioCtx.currentTime)
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime)
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime)
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime)
    compressor.connect(audioCtx.destination)
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function getOutput() {
  getCtx()
  return compressor || audioCtx.destination
}

// Language to speech voice mapping
const LANG_VOICE = {
  en: 'en-US',
  ur: 'ur-PK',
  hi: 'hi-IN',
}

// Cache best voices per language
let voiceCache = {}

function getBestVoice(langCode) {
  if (voiceCache[langCode]) return voiceCache[langCode]
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  
  const langBase = langCode.split('-')[0] // e.g. 'ur' from 'ur-PK'
  const preferred = voices.filter(v => v.lang.startsWith(langBase))
  const natural = preferred.find(v => 
    v.name.toLowerCase().includes('natural') || 
    v.name.toLowerCase().includes('enhanced') ||
    v.name.toLowerCase().includes('premium') ||
    v.name.toLowerCase().includes('google')
  )
  let result = natural || preferred.find(v => v.lang === langCode) || preferred[0] || null
  
  // Fallback: if no Urdu/Hindi voice found, try Hindi for Urdu and vice versa (similar scripts)
  if (!result && langBase === 'ur') {
    result = voices.find(v => v.lang.startsWith('hi')) || null
  }
  if (!result && langBase === 'hi') {
    result = voices.find(v => v.lang.startsWith('ur')) || null
  }
  // Last resort: use English voice (better than silence!)
  if (!result) {
    result = voices.find(v => v.lang.startsWith('en')) || voices[0] || null
  }
  
  if (result) voiceCache[langCode] = result
  return result
}

// Check if a language voice is available
export function hasVoice(lang) {
  const voices = window.speechSynthesis.getVoices()
  const langBase = (LANG_VOICE[lang] || 'en-US').split('-')[0]
  return voices.some(v => v.lang.startsWith(langBase))
}

// Preload voices
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    voiceCache = {} // Reset cache when voices load
    window.speechSynthesis.getVoices()
  }
}

// Speak a word using browser speech synthesis
function speak(text, lang = 'en', rate = 0.85) {
  try {
    window.speechSynthesis.cancel()
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      const voiceLang = LANG_VOICE[lang] || 'en-US'
      utterance.lang = voiceLang
      
      const voice = getBestVoice(voiceLang)
      if (voice) {
        const voiceBase = voice.lang.split('-')[0]
        const requestedBase = voiceLang.split('-')[0]
        if (voiceBase === requestedBase) utterance.voice = voice
      }
      
      utterance.rate = rate
      utterance.pitch = 1.15
      utterance.volume = 0.85
      window.speechSynthesis.speak(utterance)
    }, 50)
  } catch(e) { console.log('Speech error:', e) }
}

// Speak a prompt to the child - "Choose [name]!" before they tap
// Returns a promise that resolves when speech finishes (or after timeout)
export function speakPrompt(name, lang = 'en') {
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel()
      const voiceLang = LANG_VOICE[lang] || 'en-US'
      
      // Build the phrase in the correct language
      const phrases = {
        en: `Choose ${name}`,
        ur: `${name} کا انتخاب کریں`,
        hi: `${name} चुनो`,
      }
      const text = phrases[lang] || phrases.en
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text)
        // Always set the requested language — browser will use its best available voice
        // Don't force a mismatched voice (causes "Choose bandar" instead of proper Urdu)
        utterance.lang = voiceLang
        
        // Only set voice if it matches the requested language
        const voice = getBestVoice(voiceLang)
        if (voice) {
          const voiceBase = voice.lang.split('-')[0]
          const requestedBase = voiceLang.split('-')[0]
          if (voiceBase === requestedBase) {
            utterance.voice = voice
          }
          // If voice doesn't match language, let browser pick automatically
        }
        
        utterance.rate = 0.8
        utterance.pitch = 1.2
        utterance.volume = 0.9
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        setTimeout(resolve, 3000)
        window.speechSynthesis.speak(utterance)
      }, 50)
    } catch(e) { resolve() }
  })
}

// Speak just the name of a color/shape clearly
export function speakName(name, lang = 'en') {
  try {
    window.speechSynthesis.cancel()
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(name)
      const voiceLang = LANG_VOICE[lang] || 'en-US'
      utterance.lang = voiceLang
      
      const voice = getBestVoice(voiceLang)
      if (voice) {
        const voiceBase = voice.lang.split('-')[0]
        const requestedBase = voiceLang.split('-')[0]
        if (voiceBase === requestedBase) utterance.voice = voice
      }
      
      utterance.rate = 0.8
      utterance.pitch = 1.2
      utterance.volume = 0.9
      window.speechSynthesis.speak(utterance)
    }, 50)
  } catch(e) {}
}

// Play a single clean tone (helper)
function playTone(freq, startTime, duration, volume = 0.12, type = 'sine') {
  const ctx = getCtx()
  const output = getOutput()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(output)
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  // Smooth envelope to prevent clicks/pops
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02) // fast fade in
  gain.gain.setValueAtTime(volume, startTime + duration - 0.05)
  gain.gain.linearRampToValueAtTime(0, startTime + duration) // smooth fade out
  osc.start(startTime)
  osc.stop(startTime + duration)
}

// Happy ascending tones - gentle and clean
function playHappyTone() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    const notes = [523, 659, 784] // C5, E5, G5
    notes.forEach((freq, i) => {
      playTone(freq, now + i * 0.12, 0.2, 0.1, 'sine')
    })
  } catch(e) {}
}

// Gentle sad tone - descending
function playSadTone() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    playTone(400, now, 0.25, 0.08, 'sine')
    playTone(320, now + 0.2, 0.3, 0.08, 'sine')
  } catch(e) {}
}

// Pop sound effect for balloon pop games
export function playPopSound() {
  try {
    const ctx = getCtx()
    const output = getOutput()
    const now = ctx.currentTime
    // Short noise burst that sounds like a pop
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(output)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
  } catch(e) {}
}

// CORRECT: Happy tone + voice says "[answer]! Yes!"
export function playCorrectSound(answerName, lang = 'en') {
  playHappyTone()
  const phrases = {
    en: `${answerName}! Yes!`,
    ur: `${answerName}! ہاں!`,
    hi: `${answerName}! हाँ!`,
  }
  setTimeout(() => speak(phrases[lang] || phrases.en, lang), 400)
}

// WRONG: Sad tone + voice says "No, the answer is [correct answer]"
export function playWrongSound(correctName, lang = 'en') {
  playSadTone()
  const phrases = {
    en: `No, the answer is ${correctName}`,
    ur: `نہیں، جواب ${correctName} ہے`,
    hi: `नहीं, जवाब ${correctName} है`,
  }
  setTimeout(() => speak(phrases[lang] || phrases.en, lang), 450)
}

// Level up celebration fanfare + voice
export function playLevelUpSound(lang = 'en') {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      playTone(freq, now + i * 0.15, 0.35, 0.1, 'triangle')
    })
  } catch(e) {}
  const phrases = {
    en: 'Amazing! Level up!',
    ur: 'شاندار! اگلا مرحلہ!',
    hi: 'शानदार! अगला स्तर!',
  }
  setTimeout(() => speak(phrases[lang] || phrases.en, lang, 0.85), 750)
}

// Countdown beep
export function playCountdownBeep(isFinal = false) {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    const freq = isFinal ? 880 : 440
    playTone(freq, now, isFinal ? 0.3 : 0.15, 0.08, 'sine')
  } catch(e) {}
}
