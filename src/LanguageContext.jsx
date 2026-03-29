import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('kidslearn-lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('kidslearn-lang', lang)
  }, [lang])

  const t = translations[lang]
  const isRtl = lang === 'ur'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
