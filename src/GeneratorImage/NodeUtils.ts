import BaseEvent from './BaseEvent'

export default class NodeUtils extends BaseEvent {
  constructor() {
    super()
  }
  /** 将文字截短, 避免超长溢出 */
  truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    let str = ''
    const textList = Array.from(text)
    for (let index = 0; index < textList.length; index++) {
      const char = textList[index]
      const size = ctx.measureText(str + char)
      if (size.width > maxWidth) {
        return str
      } else {
        str = str + char
      }
    }
    return str
  }
  /** 将文字截断, 分割成几段 */
  // splitText(ctx: CanvasRenderingContext2D, text:string, maxWidth:number): string[] {}
}
