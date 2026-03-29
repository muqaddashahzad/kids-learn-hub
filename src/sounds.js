// Sound effects using Web Audio API + Speech Synthesis for voice feedback

const AudioCtx = window.AudioContext || window.webkitAudioContext
let audioCtx = null

function getCtx() {
  if (!audioCtx) audioCtx = new AudioCtx()
  return audioCtx
}

// Language to speech voice mapping
const LANG_VOICE = {
  en: 'en-US',
  ur: 'ur-PK',
  hi: 'hi-IN',
}

// Speak a word using browser speech synthesis
function speak(text, lang = 'en', rate = 0.9) {
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANG_VOICE[lang] || 'en-US'
    utterance.rate = rate
    utterance.pitch = 1.2 // slightly higher pitch for kids
    utterance.volume = 1
    window.speechSynthesis.cancel() // stop any ongoing speech
    window.speechSynthesis.speak(utterance)
  } catch(e) { console.log('Speech error:', e) }
}

// Happy ascending tones
function playHappyTone() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.04)
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.25)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.3)
    })
  } catch(e) {}
}

// Gentle sad tone
function playSadTone() {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    const notes = [400, 300]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.frequency.linearRampToValueAtTime(freq * 0.85, now + i * 0.2 + 0.25)
      gain.gain.setValueAtTime(0, now + i * 0.2)
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.2 + 0.04)
      gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.35)
      osc.start(now + i * 0.2)
      osc.stop(now + i * 0.2 + 0.4)
    })
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
  setTimeout(() => speak(phrases[lang] || phrases.en, lang), 350)
}

// WRONG: Sad tone + voice says "No, the answer is [correct answer]"
export function playWrongSound(correctName, lang = 'en') {
  playSadTone()
  const phrases = {
    en: `No, the answer is ${correctName}`,
    ur: `نہیں، جواب ${correctName} ہے`,
    hi: `नहीं, जवाब ${correctName} है`,
  }
  setTimeout(() => speak(phrases[lang] || phrases.en, lang), 400)
}

// Level up celebration fanfare + voice
export function playLevelUpSound(lang = 'en') {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.15)
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05)
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.45)
      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.5)
    })
  } catch(e) {}
  const phrases = {
    en: 'Amazing! Level up!',
    ur: 'شاندار! اگلا مرحلہ!',
    hi: 'शानदार! अगला स्तर!',
  }
  setTimeout(() => speak(phrases[lang] || phrases.en, lang, 0.85), 700)
}
