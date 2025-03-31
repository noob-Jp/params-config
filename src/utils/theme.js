// 主题管理工具

// 主题类型
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark'
}

// 获取当前主题
export function getCurrentTheme() {
  return localStorage.getItem('theme') || THEME_TYPES.LIGHT
}

// 设置主题
export function setTheme(theme) {
  if (theme === THEME_TYPES.DARK) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', THEME_TYPES.DARK)
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', THEME_TYPES.LIGHT)
  }
}

// 切换主题
export function toggleTheme() {
  const currentTheme = getCurrentTheme()
  const newTheme = currentTheme === THEME_TYPES.LIGHT ? THEME_TYPES.DARK : THEME_TYPES.LIGHT
  setTheme(newTheme)
  return newTheme
}

// 初始化主题
export function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  
  // 如果有保存的主题设置，使用它
  if (savedTheme) {
    setTheme(savedTheme)
    return
  }
  
  // 如果没有保存的主题，检查系统偏好
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setTheme(prefersDark ? THEME_TYPES.DARK : THEME_TYPES.LIGHT)
}
