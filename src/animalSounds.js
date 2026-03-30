// Realistic animal sounds using Web Audio API synthesis
// Each sound uses oscillators, noise, and filters to approximate the real animal

const AudioCtx = window.AudioContext || window.webkitAudioContext
let ctx = null
let compressor = null

function getCtx() {
  if (!ctx) {
    ctx = new AudioCtx({ sampleRate: 44100 })
    compressor = ctx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-20, ctx.currentTime)
    compressor.knee.setValueAtTime(30, ctx.currentTime)
    compressor.ratio.setValueAtTime(8, ctx.currentTime)
    compressor.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function out() {
  getCtx()
  return compressor || ctx.destination
}

// Helper: play a tone with vibrato (for animal calls)
function animalTone(freq, duration, type = 'sine', vol = 0.2, vibratoRate = 0, vibratoDepth = 0, startTime = null) {
  const c = getCtx()
  const now = startTime || c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(out())
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)

  if (vibratoRate > 0) {
    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    lfo.frequency.setValueAtTime(vibratoRate, now)
    lfoGain.gain.setValueAtTime(vibratoDepth, now)
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    lfo.start(now)
    lfo.stop(now + duration)
  }

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + 0.03)
  gain.gain.setValueAtTime(vol, now + duration * 0.7)
  gain.gain.linearRampToValueAtTime(0, now + duration)
  osc.start(now)
  osc.stop(now + duration)
}

// Helper: frequency sweep
function sweep(startFreq, endFreq, duration, type = 'sine', vol = 0.2) {
  const c = getCtx()
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.connect(gain)
  gain.connect(out())
  osc.type = type
  osc.frequency.setValueAtTime(startFreq, now)
  osc.frequency.linearRampToValueAtTime(endFreq, now + duration)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + 0.02)
  gain.gain.setValueAtTime(vol, now + duration * 0.6)
  gain.gain.linearRampToValueAtTime(0, now + duration)
  osc.start(now)
  osc.stop(now + duration)
}

// Helper: noise burst (for hissing, splashing, etc)
function noiseBurst(duration, vol = 0.1, filterFreq = 2000) {
  const c = getCtx()
  const now = c.currentTime
  const bufferSize = c.sampleRate * duration
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1)
  const source = c.createBufferSource()
  source.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(filterFreq, now)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + 0.02)
  gain.gain.linearRampToValueAtTime(0, now + duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(out())
  source.start(now)
}

// =============== ANIMAL SOUNDS ===============

const sounds = {
  Cat: () => {
    // Meow: rising then falling tone
    const c = getCtx(); const now = c.currentTime
    animalTone(400, 0.15, 'sine', 0.15, 0, 0, now)      // "me"
    animalTone(700, 0.25, 'sine', 0.2, 6, 30, now + 0.15) // "ow" (with vibrato)
    animalTone(500, 0.2, 'sine', 0.12, 0, 0, now + 0.4)   // falling
  },

  Dog: () => {
    // Woof woof: short percussive barks
    const c = getCtx(); const now = c.currentTime
    // First bark
    sweep(300, 150, 0.15, 'sawtooth', 0.15)
    noiseBurst(0.08, 0.1, 800)
    // Second bark after short pause
    setTimeout(() => {
      sweep(320, 160, 0.15, 'sawtooth', 0.15)
      noiseBurst(0.08, 0.1, 800)
    }, 250)
  },

  Cow: () => {
    // Moooo: long low tone with vibrato
    animalTone(130, 0.8, 'sawtooth', 0.12, 4, 15, null)
    animalTone(140, 0.8, 'sine', 0.1, 3, 10, null)
  },

  Lion: () => {
    // Roar: low rumbling sweep
    sweep(200, 80, 0.6, 'sawtooth', 0.2)
    noiseBurst(0.5, 0.12, 1200)
    setTimeout(() => sweep(180, 70, 0.4, 'sawtooth', 0.15), 300)
  },

  Elephant: () => {
    // Trumpet: high nasal sound
    const c = getCtx(); const now = c.currentTime
    animalTone(500, 0.3, 'square', 0.1, 8, 50, now)
    animalTone(700, 0.4, 'square', 0.12, 10, 60, now + 0.15)
    animalTone(400, 0.3, 'square', 0.08, 0, 0, now + 0.5)
  },

  Duck: () => {
    // Quack quack
    const c = getCtx(); const now = c.currentTime
    sweep(600, 300, 0.12, 'sawtooth', 0.15)
    setTimeout(() => sweep(620, 310, 0.12, 'sawtooth', 0.15), 200)
  },

  Chicken: () => {
    // Cluck cluck: short staccato
    const c = getCtx(); const now = c.currentTime
    animalTone(400, 0.08, 'square', 0.12, 0, 0, now)
    animalTone(500, 0.06, 'square', 0.1, 0, 0, now + 0.1)
    animalTone(380, 0.08, 'square', 0.12, 0, 0, now + 0.25)
    animalTone(480, 0.06, 'square', 0.1, 0, 0, now + 0.35)
  },

  Horse: () => {
    // Neigh: rising whistle-like sound
    sweep(300, 800, 0.3, 'sawtooth', 0.12)
    setTimeout(() => sweep(700, 400, 0.25, 'sawtooth', 0.1), 300)
    setTimeout(() => animalTone(500, 0.2, 'sawtooth', 0.08, 8, 40), 500)
  },

  Sheep: () => {
    // Baa: nasal bleating
    animalTone(350, 0.4, 'sawtooth', 0.12, 6, 25)
    setTimeout(() => animalTone(300, 0.3, 'sawtooth', 0.1, 5, 20), 200)
  },

  Pig: () => {
    // Oink oink: nasal short sounds
    const c = getCtx(); const now = c.currentTime
    sweep(200, 350, 0.15, 'sawtooth', 0.12)
    noiseBurst(0.1, 0.06, 600)
    setTimeout(() => {
      sweep(210, 360, 0.15, 'sawtooth', 0.12)
      noiseBurst(0.1, 0.06, 600)
    }, 250)
  },

  Frog: () => {
    // Ribbit: two-tone croak
    const c = getCtx(); const now = c.currentTime
    animalTone(180, 0.12, 'square', 0.12, 0, 0, now)
    animalTone(250, 0.15, 'square', 0.15, 15, 30, now + 0.12)
    setTimeout(() => {
      animalTone(180, 0.1, 'square', 0.1, 0, 0)
      setTimeout(() => animalTone(260, 0.12, 'square', 0.12, 15, 30), 100)
    }, 400)
  },

  Bird: () => {
    // Tweet tweet: high chirps
    const c = getCtx(); const now = c.currentTime
    sweep(1200, 1800, 0.08, 'sine', 0.12)
    setTimeout(() => sweep(1400, 2000, 0.06, 'sine', 0.1), 120)
    setTimeout(() => sweep(1100, 1700, 0.08, 'sine', 0.12), 350)
    setTimeout(() => sweep(1300, 1900, 0.06, 'sine', 0.1), 470)
  },

  Fish: () => {
    // Splash: noise + bubbly
    noiseBurst(0.3, 0.15, 3000)
    const c = getCtx(); const now = c.currentTime
    // Bubbles
    ;[0.1, 0.18, 0.25].forEach(t => {
      animalTone(800 + Math.random() * 400, 0.05, 'sine', 0.06, 0, 0, now + t)
    })
  },

  Monkey: () => {
    // Ooh ooh: excited hoots
    const c = getCtx(); const now = c.currentTime
    sweep(400, 700, 0.15, 'sawtooth', 0.12)
    setTimeout(() => sweep(500, 800, 0.12, 'sawtooth', 0.12), 200)
    setTimeout(() => sweep(450, 750, 0.1, 'sawtooth', 0.1), 380)
  },

  Bear: () => {
    // Growl: low rumble
    animalTone(90, 0.6, 'sawtooth', 0.15, 3, 10)
    noiseBurst(0.4, 0.08, 500)
  },

  Rabbit: () => {
    // Squeak: tiny high sound
    sweep(1000, 1400, 0.08, 'sine', 0.1)
    setTimeout(() => sweep(1100, 1500, 0.06, 'sine', 0.08), 150)
  },
}

// Play an animal sound by name
export function playAnimalSound(animalName) {
  try {
    getCtx() // ensure audio context is ready
    const fn = sounds[animalName]
    if (fn) fn()
  } catch(e) {
    console.log('Animal sound error:', e)
  }
}
