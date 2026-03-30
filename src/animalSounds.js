// Realistic animal sounds using pre-generated MP3 files
// Files are in /public/sounds/{animal}.mp3

const BASE_PATH = import.meta.env.BASE_URL + 'sounds/'

// Preload audio elements for instant playback
const audioCache = {}

function getAudio(name) {
  const key = name.toLowerCase()
  if (!audioCache[key]) {
    audioCache[key] = new Audio(BASE_PATH + key + '.mp3')
    audioCache[key].preload = 'auto'
  }
  return audioCache[key]
}

// Map animal names to sound file names
const SOUND_MAP = {
  Cat: 'cat',
  Dog: 'dog',
  Cow: 'cow',
  Lion: 'lion',
  Elephant: 'elephant',
  Duck: 'duck',
  Chicken: 'chicken',
  Horse: 'horse',
  Sheep: 'sheep',
  Pig: 'pig',
  Frog: 'frog',
  Bird: 'bird',
  Fish: 'fish',
  Monkey: 'monkey',
  Bear: 'bear',
  Rabbit: 'rabbit',
}

// Preload all sounds on first user interaction
let preloaded = false
export function preloadAnimalSounds() {
  if (preloaded) return
  preloaded = true
  Object.values(SOUND_MAP).forEach(name => {
    try { getAudio(name) } catch(e) {}
  })
}

// Play an animal sound by name
export function playAnimalSound(animalName) {
  try {
    const file = SOUND_MAP[animalName]
    if (!file) return
    const audio = getAudio(file)
    audio.currentTime = 0
    audio.volume = 0.8
    audio.play().catch(() => {})
  } catch(e) {
    console.log('Animal sound error:', e)
  }
}
