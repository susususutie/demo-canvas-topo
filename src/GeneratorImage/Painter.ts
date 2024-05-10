import BaseEvent from './BaseEvent'
import CircleNode from './CircleNode'
import SingleNode from './SingleNode'
import { PainterData } from './type'

export default class Painter extends BaseEvent {
  _previewCanvas: HTMLCanvasElement
  _previewContext: CanvasRenderingContext2D
  _nodes: (SingleNode|CircleNode)[] = []
  _links: string[] = []
  _isReady: boolean = false
  _background = '#fff'

  _parseLinks(links: {source:string;target:string}[]): string[] {
    let source: string|null = links[0].source
    let target: string|null = links[0].target
    const sortList = [source, target]
    while (source || target) {
      const beforeItem = links.find((i) => i.target === source)
      if (beforeItem) {
        source = beforeItem.source
        sortList.unshift(beforeItem.source)
      } else {
        source = null
      }
      const nextItem = links.find((i) => i.source === target)
      if (nextItem) {
        target = nextItem.target
        sortList.push(nextItem.target)
      } else {
        target = null
      }
    }
    return sortList
  }
  /** 计算, 并重设节点位置 */
  _layout() {
    const canvasHeight = this._previewCanvas.height
    let layoutX = 0,
      layoutY = canvasHeight * 0.5
    const gapH = 88
    this._links.forEach((id, index) => {
      const node = this._nodes.find((node) => node.getId() === id)
      if (!node) return

      const { width, height } = node.getClientRect()

      if (height > canvasHeight) {
        this._previewCanvas.height = Math.ceil(height * 0.1) * 10
      }

      layoutX += width * 0.5 + (index !== 0 ? gapH : 0)
      node.setPos({x:layoutX, y:layoutY})
      layoutX += width * 0.5
    })
    if (layoutX > this._previewCanvas.width) {
      this._previewCanvas.width = Math.ceil(layoutX * 0.1) * 10
    }
  }
  /** 绘制所有节点 */
  _draw() {
    this._previewContext.clearRect(0, 0, this._previewCanvas.width, this._previewCanvas.height)
    this._previewContext.fillStyle = this._background
    this._previewContext.fillRect(0, 0, this._previewCanvas.width, this._previewCanvas.height)
    const nodeIdRectMap = new Map<string, [number, number]>()
    this._nodes.forEach((node) => {
      const id = node.getId()
      const {x, y} = node.getClientRect()
      nodeIdRectMap.set(id, [x, y])
    })
    this._links.forEach((nodeId, index, arr) => {
      if (index===0) return
      const [prevX, prevY] = nodeIdRectMap.get(arr[index - 1])!
      const [x, y] = nodeIdRectMap.get(nodeId)!
      this._drawLine(prevX, prevY, x, y)
    })
    this._nodes.forEach((node) => node.draw(this._previewContext))
  }
  _drawLine(x1:number, y1:number, x2:number, y2:number) {
    this._previewContext.save()
    this._previewContext.strokeStyle = '#3385FF'
    this._previewContext.lineWidth = 1
    this._previewContext.moveTo(x1, y1)
    this._previewContext.lineTo(x2, y2)
    this._previewContext.stroke()
    this._previewContext.restore()
  }
  _initData(data: PainterData) {
    const { nodes: nodeConfigs = [], links: linkConfigs = [] } = data

    const nodes = nodeConfigs.map((_cfg) => {
      const { type, ...cfg } = _cfg
      if (type === 'single') {
        const node = new SingleNode(cfg)
        node.on('update', this._updateNode.bind(this))
        return node
      }
    }).filter(Boolean) as SingleNode[]

    const sortNodeIds = this._parseLinks(linkConfigs)

    const start = new CircleNode({ id: 'start', text: '开始' })
    const end = new CircleNode({ id: 'end', text: '结束' })

    this._nodes.push(start, ...nodes, end)
    this._links = ['start', ...sortNodeIds, 'end']

    this._layout()
  }
  _timer: number = 0
  _updateNode() {
    clearTimeout(this._timer)
    this._timer = setTimeout(() => {
      this._draw()
      const idleNodes = this._nodes.filter(node => node.getStatus() !== 'READY')
      if (idleNodes.length === 0) {
        this._isReady = true
        this.emit('ready')
      }
    }, 80)
    
  }
  _getMarginRect() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    this._nodes.forEach(node => {
      const rect = node.getMarginRect()
      x0 = Math.min(x0, rect.left)
      y0 = Math.min(y0, rect.top)
      x1 = Math.max(x1, rect.left + rect.width)
      y1 = Math.max(y1, rect.top + rect.height)
    })
    return {x: x0, y: y0, width: x1-x0, height: y1-y0}
  }
  _genImgWithPadding() {
    const padding = [10, 20, 30, 40]
    const marginRect = this._getMarginRect()
    const tempCanvas = document.createElement('canvas')
    tempCanvas.height = marginRect.height + padding[0] + padding[2]
    tempCanvas.width = marginRect.width + padding[1] + padding[3]
    const ctx = tempCanvas.getContext('2d')!
    ctx.fillStyle = this._background
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    const imgData = this._previewContext.getImageData(marginRect.x, marginRect.y, marginRect.width, marginRect.height)
    ctx.putImageData(imgData, padding[3], padding[0])
    return tempCanvas.toDataURL()
  }

  constructor(data: PainterData, rerender?: boolean) {
    super()
    this._previewCanvas = document.createElement('canvas')
    this._previewCanvas.style.background = 'transparent'
    this._previewContext = this._previewCanvas.getContext('2d')!
    document.body.append(this._previewCanvas)

    this._initData(data)
    if (rerender) {
      this._draw()
    }
  }

  async toPng() {
    if (this._isReady){
      return this._genImgWithPadding()
    } else {
      return new Promise((resolve) => {
        this.on('ready', () => {
          resolve(this._genImgWithPadding())
        })
      })
    }
  }
}