import { ref } from 'vue'
import { messages } from './lang.js'

export const currentLang = ref(localStorage.getItem('lang') || 'zh')

export const setLang = (lang) => {
  currentLang.value = lang
  localStorage.setItem('lang', lang)
}

export const toggleLang = () => {
  const newLang = currentLang.value === 'zh' ? 'en' : 'zh'
  setLang(newLang)
}

export const t = (key) => {
  const keys = key.split('.')
  let value = messages[currentLang.value]
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) return key
  }
  
  return value
}