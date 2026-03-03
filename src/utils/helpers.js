// 安全访问 localStorage
export const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('localStorage access failed:', error)
      return null
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('localStorage set failed:', error)
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('localStorage remove failed:', error)
    }
  }
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
