import NodeUtils from './NodeUtils'
import type { AbstractNode, ClientRect, MarginRect, Pos } from './type'

export default class CircleNode extends NodeUtils implements AbstractNode  {
  _id: string
  _centerX: number = 0
  _centerY: number = 0
  _r: number = 24
  _borderWidth: number = 2

  _text: string
  
  constructor(options: {id:string, text: string}) {
    super()
    this._id = options.id
    this._text = options.text
  }

  getStatus(): 'IDLE' | 'READY' {
    return 'READY'
  }

  getId() {
    return this._id
  }

  /** 设置节点位置(以锚点计算) */
  setPos(pos: Partial<Pos>): void {
    if ('x' in pos && typeof pos.x === 'number') {
      this._centerX = pos.x
    }
    if ('y' in pos && typeof pos.y === 'number') {
      this._centerY = pos.y
    }
  }

  getClientRect(): ClientRect {
    return {
      width: this._r * 2 + this._borderWidth,
      height: this._r * 2 + this._borderWidth,
      left: this._centerX - this._r - this._borderWidth * 0.5,
      top: this._centerY - this._r - this._borderWidth * 0.5,
      x: this._centerX,
      y: this._centerY,
    }
  }

  getMarginRect(): MarginRect {
    const {width, height, left, top} =this.getClientRect()
    return {width, height, left, top}
  }

  draw(ctx: CanvasRenderingContext2D) {
    const x = this._centerX
    const y = this._centerY

    ctx.save()
    // circle
    ctx.beginPath()
    ctx.arc(x, y, this._r, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.lineWidth = this._borderWidth
    ctx.strokeStyle = '#f0f1f5'
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
    // text
    ctx.beginPath()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#3385FF'
    ctx.font = '14px Avenir, Helvetica, Arial, sans-serif'
    ctx.fillText(this._text, x, y, this._r * 2 - 4)
    ctx.closePath()
    ctx.restore()
  }
}