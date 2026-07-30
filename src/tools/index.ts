import clipBoard from "vue-clipboard3"

const Clip = clipBoard
const { toClipboard } = Clip()

export const deepCopy = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    console.warn('Deep copy failed due to', e, '\norigin:', obj)
    return obj
  }
}
export const assignDefaults = (defaultVal: any, currentVal: any) => {
  for (const key in defaultVal) {
    if (Object.prototype.hasOwnProperty.call(defaultVal, key) && key !== '__proto__' && key !== 'constructor') {
      if (typeof defaultVal[key] === 'object' && !Array.isArray(defaultVal[key]) && defaultVal[key] !== null) {
        if (!Object.prototype.hasOwnProperty.call(currentVal, key)) {
          currentVal[key] = {};
        }
        currentVal[key] = assignDefaults(defaultVal[key], currentVal[key]);
      } else {
        currentVal[key] = currentVal[key] !== undefined ? currentVal[key] : defaultVal[key];
      }
    }
  }
  return currentVal;
}
export const objectEqual = <T>(obj1: T, obj2: T): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

/** 生成一个数组，包含从`from`到`to`之间的所有整数 */
export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 将给定文本复制到设备的剪贴板。
 * @param text 要复制的文本
 * @param container 在模态框中调用此函数必须传入模态框中的某个div容器的ref-value
 * @returns 如果成功，返回空字符串。否则返回"ERROR"。
 */
export const CopyToClipboard = async (text: string, container?: string | HTMLElement | undefined | null) => {
  try {
    let htmlElement: HTMLElement | undefined | null = null
    if (typeof container === 'string') {
      htmlElement = document.getElementById(container)
      if (!htmlElement) {
        console.warn('Container not found for CopyToClipboard:', container)
      }
    } else {
      htmlElement = container
    }
    await toClipboard(text, htmlElement ?? undefined)
    return ''
  } catch (e) {
    console.warn('Copy to clipboard action failed due to', e)
    return 'ERROR'
  }
}
