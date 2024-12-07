import NodeUtils from './NodeUtils'
import type { AbstractNode, ClientRect, MarginRect, Pos } from './type'

export default class SingleNode extends NodeUtils implements AbstractNode {
  _id: string
  _anchorX: number = 0
  _anchorY: number = 0
  _w: number = 72
  _h: number = 80
  _anchor: [number, number] = [this._w * 0.5, this._h * 0.5]

  _status: 'IDLE' | 'READY' = 'IDLE'
  _icon: HTMLImageElement | null = null
  _text: string
  _name: string

  /** 获取节点左上角的实际位置 */
  _getRealPos(): [number, number] {
    return [this._anchorX - this._anchor[0], this._anchorY - this._anchor[1]]
  }

  constructor(options: { id: string; icon: string; text: string; name: string }) {
    super()
    this._id = options.id
    this._text = options.text
    this._name = options.name
    const icon = new Image()
    icon.src = options.icon

    icon.onload = () => {
      // 模拟图片加载
      setTimeout(() => {
        this._icon = icon
        this._status = 'READY'
        this.emit('update')
      }, Math.random() * 3000)
    }
  }

  getStatus(): 'IDLE' | 'READY' {
    return this._status
  }

  getId() {
    return this._id
  }

  /** 设置节点位置(以锚点计算) */
  setPos(pos: Partial<Pos>): void {
    if ('x' in pos && typeof pos.x === 'number') {
      this._anchorX = pos.x
    }
    if ('y' in pos && typeof pos.y === 'number') {
      this._anchorY = pos.y
    }
  }

  getClientRect(): ClientRect {
    const [x, y] = this._getRealPos()
    return { width: this._w, height: this._h, left: x, top: y, x: this._anchorX, y: this._anchorY }
  }

  getMarginRect(): MarginRect {
    const [x, y] = this._getRealPos()
    return {
      width: this._w,
      height: this._h + 20, // text height
      left: x,
      top: y,
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const [x, y] = this._getRealPos()

    ctx.save()
    // rect
    ctx.beginPath()
    ctx.roundRect(x, y, this._w, this._h, 4)
    ctx.fillStyle = '#e5f1ff'
    ctx.fill()
    ctx.closePath()
    // icon {width: 56, height: auto, top: 8, left: 8}
    ctx.beginPath()
    if (this._icon) {
      ctx.drawImage(this._icon, x + 8, y + 8, 56, this._icon.height * (56 / this._icon.width))
    }
    ctx.closePath()
    // p {width: 100%, height: 20, top: 60, left: 0, border-radius: 0 0 4 4, background-color: #3385ffcc}
    ctx.beginPath()
    ctx.roundRect(x, y + 60, this._w, 20, [0, 0, 4, 4])
    ctx.fillStyle = '#3385ffcc'
    ctx.fill()
    ctx.closePath()
    // p>text
    ctx.beginPath()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.font = '14px Avenir, Helvetica, Arial, sans-serif'
    const text = this.truncateText(ctx, this._text, this._w)
    ctx.fillText(text, x + this._w * 0.5, y + 60 + 10, this._w - 4)
    ctx.closePath()
    // text
    ctx.beginPath()
    ctx.fillStyle = '#38415c'
    ctx.fillText(this._name, x + this._w * 0.5, y + this._h + 10, this._w + 32)
    ctx.closePath()
    ctx.restore()
  }
}
