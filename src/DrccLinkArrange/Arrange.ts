import Konva from 'konva'
import { Group } from 'konva/lib/Group'
import type { Layer } from 'konva/lib/Layer'
import type { Stage } from 'konva/lib/Stage'
import type { Line } from 'konva/lib/shapes/Line'
import type { Rect } from 'konva/lib/shapes/Rect'
import type { Vector2d } from 'konva/lib/types'
import { NodeNormal } from './item/NodeNormal'
import { NodeAdd } from './item/NodeAdd'
import { ComboNormal } from './item/ComboNormal'
import { NodeCircle } from './item/NodeCircle'
import { EdgeLine } from './item/EdgeLine'
import { ArrangeGraph, LayoutItem, NodeShape } from './ArrangeGraph'
import { Edge } from './item/Edge'
import { Node } from './item/Node'
import { Combo } from './item/Combo'

// type EnumToUnion<T extends Record<string, string | number>> = keyof {
//   [Prop in keyof T as `${T[Prop]}`]: Prop
// }

type MinimapConfig = {container: HTMLDivElement, scale?: number }
type Cfg = {
  container: HTMLDivElement,
  minimap?: MinimapConfig | false,
  width: number,
  height: number,
  background?: string,
  grid?: boolean,
  zoom?: boolean,
  maxZoom?: number,
  minZoom?: number,
  pan?: boolean,
  autoResize?: boolean,
  dev?: boolean,
  layout?: LayoutItem[]
}
type Config = Cfg & {
  maxZoom: number,
  minZoom: number,
  pan: boolean,
}

export default class Arrange extends ArrangeGraph {
  _nodeInstanceMap = new Map<string, Edge | Node | Combo>()
  /** stage的尺寸 */
  private _width: number
  private _height: number
  /** 内部元素(node, edge)布局占用的尺寸 */
  contentRect = {x: 0, y: 0, width: 0, height: 0}
  config: Config
  _stage: Stage
  private _layer: Layer
  /** minimap */
  private _updateMinimapTimer: number | null = null
  private _minimapStage?: Stage
  private _minimapLayer?: Layer
  /** background */
  private _background?: Rect
  /** grid */
  private _grid?: Group
  private _gridLastPosition = {x:0, y:0}
  private _gridConfig = {
    fromX : 0,
    toX : 0,
    fromY : 0,
    toY : 0,
    gapH : 100,
    gapV : 100,
    strokeWidth : 1,
    stroke : '#ddd',
    dash : undefined,
  }
  private _resizeObserver: ResizeObserver | null = null

  _pushContentRect(childrenRect: {x: number, y: number, width: number, height: number}) {
    const x = this.contentRect.x
    const y = this.contentRect.y
    this.contentRect.x = Math.min(x, childrenRect.x)
    this.contentRect.y = Math.min(y, childrenRect.y)
    this.contentRect.width = Math.max(x + this.contentRect.width, childrenRect.x + childrenRect.width) - this.contentRect.x
    this.contentRect.height = Math.max(y + this.contentRect.height, childrenRect.y + childrenRect.height) - this.contentRect.y
  }

  constructor(cfg: Cfg) {
    super({layout: cfg.layout || [], showAdd: true})

    this._width = cfg.width
    this._height = cfg.height

    const {nodes} = this.getItems()

    this.contentRect.x = nodes?.[0].getRect().x ?? 0
    this.contentRect.y = nodes?.[0].getRect().y ?? 0

    this.config = {...cfg, pan: !!cfg?.pan,  minZoom: cfg?.minZoom ?? 0.5, maxZoom: cfg?.maxZoom ?? 2}

    this._stage = new Konva.Stage({
      container: cfg.container,
      width: this._width,
      height: this._height,
      draggable: this.config.pan,
    })
    this._layer = new Konva.Layer()
    if (this.config?.background) {
      this.#paintBackground()
    }
    if (this.config?.grid) {
      this._gridConfig.fromX = 0
      this._gridConfig.toX = this._width
      this._gridConfig.fromY = 0
      this._gridConfig.toY = this._height
      this.#paintGrid()
    }
    if (this.config.pan) {
      this._stage.on('mouseover', (ev) => {
        if (ev.target !== this._stage) {
          return
        }
        this.config.container.style.cursor = 'grab'
      })
      this._stage.on('mousedown', (ev) => {
        if (ev.target !== this._stage) {
          return
        }
        this.config.container.style.cursor = 'grabbing'
      })
      this._stage.on('mouseup', (ev) => {
        if (ev.target !== this._stage) {
          return
        }
        this.config.container.style.cursor = 'grab'
      })
      this._stage.on('mouseout', () => {
        this.config.container.style.cursor = 'default'
      })
      // this.#stage.on('dragstart', (ev) => {
      // })
      this._stage.on('dragmove', (ev) => {
        if (ev.target !== this._stage) {
          return
        }
        if (this._background) {
          this._background.absolutePosition({ x: 0, y: 0 })
        }
  
        // 拖动画布时, grid位置不变(一直重置为之前的位置), 尺寸变化(动态更改points)
        if (this._grid) {
          this._grid.absolutePosition(this._gridLastPosition)
        }

        this.#updateMinimap()
      })
    }
    if (this.config?.zoom) {
      this._stage.on('wheel', (e) => {
        e.evt.preventDefault()
        let direction = e.evt.deltaY > 0 ? -1 : 1
        if (e.evt.ctrlKey) {
          direction = -direction
        }
        
        const oldScale = this._stage.scaleX()
        let newScale = direction > 0 ? oldScale + 0.05 : oldScale - 0.05
        newScale = Math.min(Math.max(this.config.minZoom, Math.round(newScale * 100) / 100), this.config.maxZoom)
        if(newScale === oldScale) {
          return
        }
        const pointer = this._stage.getPointerPosition()!
        this.#scaleByPoint(pointer, newScale)
      })
    }
    this.#addEdgesToLayer()
    this.#addNodesToLayer()
    if (this.config.dev) {
      this.#paintDevRect()
    }
    this._stage.add(this._layer)

    if (this.config.minimap) {
      requestAnimationFrame(() => {
        this.#genMinimap()
      })
    }

    if (this.config.autoResize) {
      this.#autoResize()
    }
  }

  stopStageDraggable() {
    this._stage.draggable(false)
  }
  resetStageDraggable() {
    this._stage.draggable(this.config.pan)
  }

  resize(width: number, height?: number) {
    this._width = width
    this._stage.width(width)
    this._background?.width(width)
    if (height) {
      this._height = height
      this._stage.height(height)
      this._background?.height(height)
    }
    if (this._grid) {
      this.#updateGridPoints()
    }
    if (this._minimapStage) {
      this.#updateMinimap()
    }
    if (this.config.dev) {
      this.#updateDevRect()
    }
  }

  #paintBackground() {
    const color = this.config?.background
    if (!color || color === 'transparent') {
      return
    }
    this._background = new Konva.Rect({
      id: 'background',
      x: 0,
      y: 0,
      width: this._width,
      height: this._height,
      fill: color,
      listening: false,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: this._width, y: this._height },
      // gradient into transparent color, so we can see CSS styles
      fillLinearGradientColorStops: [
        0,
        'rgb(222, 111, 111)',
        1,
        'rgb(111, 222, 111)',
      ],
    })
    this._layer.add(this._background)
  }

  #paintGrid() {
    const showGrid = this.config?.grid
    if (!showGrid) {
      return
    }
    const { strokeWidth, stroke, dash } = this._gridConfig
    const group = new Konva.Group({
      id: 'grid-group',
      // clip: {
      //   x: 0,
      //   y: 0,
      //   width,
      //   height,
      // },
      x: 0,
      y: 0,
      width: this._width,
      height: this._height,
      listening: false,
      draggable: false,
    })
    const [pointsH, pointsV] = this.#getGridPoints()
    const hLine = new Konva.Line({
      id: 'grid-h',
      points: pointsH,
      stroke,
      strokeWidth: strokeWidth,
      dash,
      listening: false,
    })
    const vLine = new Konva.Line({
      id: 'grid-v',
      points: pointsV,
      stroke,
      strokeWidth: strokeWidth,
      dash,
      listening: false,
    })
    group.add(hLine)
    group.add(vLine)
    this._grid = group
    this._layer.add(this._grid)
  }

  #getGridPoints() {
    const { fromY, toY, fromX, toX, gapH, gapV, strokeWidth } = this._gridConfig

    const delta = Math.ceil(strokeWidth / 2) // 线条走远点再换行, 避免太粗的线条在换行时显示在画布上

    const startYIndex = Math.ceil((fromY - strokeWidth / 2) / gapV)
    const endYIndex = Math.ceil((toY + strokeWidth / 2) / gapV)
    const countH = endYIndex - startYIndex
    const pointsH = Array.from({ length: countH }).flatMap((_, index) => {
      const y = gapV * (index + startYIndex)
      return index % 2 === 0
        ? [fromX - delta, y, toX + delta, y]
        : [toX + delta, y, fromX - delta, y]
    })

    const startXIndex = Math.ceil((fromX - strokeWidth / 2) / gapH)
    const endXIndex = Math.ceil((toX + strokeWidth / 2) / gapH)
    const countV = endXIndex - startXIndex
    const pointsV = Array.from({ length: countV }).flatMap((_, index) => {
      const x = gapH * (index + startXIndex)
      return index % 2 === 0
        ? [x, fromY - delta, x, toY + delta]
        : [x, toY + delta, x, fromY - delta]
    })

    return [pointsH, pointsV]
  }

  #updateGridPoints() {
    const gridPos = this._grid!.absolutePosition()
    const {x: scaleX, y: scaleY} = this._stage.scale()!
    this._gridConfig.fromX = - gridPos.x / scaleX
    this._gridConfig.toX = this._gridConfig.fromX + this._width / scaleX
    this._gridConfig.fromY = - gridPos.y / scaleY
    this._gridConfig.toY = this._gridConfig.fromY + this._height / scaleY
    const [pointsH, pointsV] = this.#getGridPoints()
    const gridV = this._stage.findOne('#grid-v')! as Line
    const gridH = this._stage.findOne('#grid-h')! as Line
    gridV.points(pointsV)
    gridH.points(pointsH)
  }

  #addEdgesToLayer() {
    const edgesGroup = new Group({
      id: 'edges-group',
      x: 0,
      y: 0,
      draggable: false,
    })
    this.getItems().edges.forEach((edge) => {
      if (edge.keyShape) {
        edgesGroup.add(edge.keyShape)
      }
    })
    this._layer.add(edgesGroup)
  }

  updateLayerEdges() {
    let addEdges = this.getItems().edges
    const $edgesWrapper = this._layer.findOne<Group>('#edges-group')!
    // const edgeDoms = this.#layer.find('.edge')
    $edgesWrapper.children.forEach((edge) => {
      const $line = edge as Line
      const id = $line.id().match(/^edge-(.+)$/)?.[1]
      if (!id) return
      // remove
      if (!this.hasEdge(id)) {
        requestAnimationFrame(() => {
          $line.remove()
        })
        return
      }
      // add
      addEdges = addEdges.filter(item => item.id === id)
      // update
      const cfg = this.getEdgeShape(id)!
      const source = this.getNodeShape(cfg.source)!
      const target = this.getNodeShape(cfg.target)! 
      $line.points([source.rect.x + source.rect.width / 2, source.rect.y, target.rect.x - target.rect.width / 2, target.rect.y])
    })
    addEdges.forEach(edge => {
      const source = this.getNodeShape(edge.source)
      const target = this.getNodeShape(edge.target)
      if (!source || !target) {
        return
      }
      const line = new EdgeLine(this, { id: edge.id, type: 'line', source, target }).shape
      $edgesWrapper.add(line)
    })
  }

  #addNodesToLayer() {
    const nodesGroup = new Group({
      id: 'nodes-group',
      x: 0,
      y: 0,
      draggable: false,
    })
 
    this.getItems().nodes.forEach((node) => {
      if(node.rootShape) {
        nodesGroup.add(node.rootShape)
        if (node.afterAdd) {
          node.afterAdd(this)
        }
      }
    })
    this._layer.add(nodesGroup)
  }

  #paintDevRect() {
    const contentRect = new Konva.Rect({
      id: 'dev-content',
      x: this.contentRect.x,
      y: this.contentRect.y,
      width: this.contentRect.width,
      height: this.contentRect.height,
      stroke: 'red',
      strokeWidth: 6,
      listening: false,
    })
    this._layer.add(contentRect)
    const stageRect = new Konva.Rect({
      id: 'dev-stage',
      x: 0,
      y: 0,
      width: this._width,
      height: this._height,
      stroke: 'lime',
      strokeWidth: 6,
      listening: false,
    })
    this._layer.add(stageRect)
  }

  #updateDevRect() {
    const contentRect = this._layer!.findOne('#dev-content')
    if (contentRect) {
      contentRect.x(this.contentRect.x)
      contentRect.y(this.contentRect.y)
      contentRect.size({width: this.contentRect.width, height: this.contentRect.height})
    }
    const stageRect = this._layer!.findOne('#dev-stage')
    if (stageRect) {
      stageRect.size({width: this._width, height: this._height})
    }
  }

  #autoResize() {
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = entry.contentBoxSize[0]
          if (contentBoxSize.inlineSize !== this._width || contentBoxSize.blockSize !== this._height) {
            this.resize(contentBoxSize.inlineSize, contentBoxSize.blockSize)
          }
        }
      }
    })
    this._resizeObserver.observe(this.config.container)
  }

  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
    }
  
    this.offAll()
    this._stage.destroy()
    this._minimapStage?.destroy()
  }

  previewAll() {
    const x = this._stage.x()
    const y = this._stage.y()
    // const {x: scaleX, y:scaleY} = this.#stage.scale()!
    const {width, height} = this._stage.size()

    return this._stage.toDataURL({
      mimeType: 'image/png',
      x: Math.min(x, 0),
      y: Math.min(y, 0),
      width: 2 * width,
      height: 2 * height,
    })
  }

  getPreview() {
    const padding = [100, 100, 100, 100]
    const originX = this._stage.x()
    const originY = this._stage.y()
    const {x: scaleX, y:scaleY} = this._stage.scale()!
    const newX =  scaleX * (- this.contentRect.x + padding[3])
    const newY =  scaleY * (- this.contentRect.y + padding[0])
    this._stage.x(newX)
    this._stage.y(newY)
    
    const imgSize = {
      x: 0,
      y: 0,
      width: scaleX * (this.contentRect.width + padding[1] + padding[3]),
      height: scaleY * (this.contentRect.height + padding[0] + padding[2]),
    }

    const {width: originWidth, height: OriginHeight} = this._stage.size()
    const width = Math.max(originWidth, originX + this.contentRect.x + this.contentRect.width + padding[3])
    const height = Math.max(OriginHeight, originY + this.contentRect.y + this.contentRect.height + padding[2])

    this.resize(width, height)
    this._background?.size({width: imgSize.width, height: imgSize.height })
    this._background?.absolutePosition({ x: 0, y: 0 })
  
    requestAnimationFrame(() => {
      this._stage.x(originX)
      this._stage.y(originY)
      this.resize(originWidth, OriginHeight)
      this._background?.size({width: originWidth, height: OriginHeight })
      this._background?.absolutePosition({ x: 0, y: 0 })
    })

    return this._stage.toDataURL({mimeType: 'image/png', ...imgSize })
  }

  downloadPNG() {
    const img = this.getPreview()
    const createEl = document.createElement('a')
    createEl.href = img
    createEl.download = 'png'
    createEl.click()
    createEl.remove()
  }

  #genMinimap() {
    if (!this.config.minimap) {
      return
    }
    const container = this.config.minimap.container
    const scale = this.config.minimap?.scale ?? 0.2
    this._minimapStage = new Konva.Stage({
      container,
      width: this._width * scale,
      height: this._height * scale,
      scale: {x: scale, y:scale},
      listening: false,
    })
    this._minimapLayer = this._layer.clone({ listening: false })
    this._minimapStage.add(this._minimapLayer)
  }

  #updateMinimap() {
    if (this._updateMinimapTimer) {
      clearTimeout(this._updateMinimapTimer)
    }
    if (!this._minimapLayer || !this._minimapStage) {
      return
    }
    this._updateMinimapTimer = setTimeout(() => {
      this.#updateMinimapInner()
    }, 1000)
  }

  #updateMinimapInner() {
    if (!this._minimapLayer || !this._minimapStage) {
      return
    }

    const {x, y} = this._stage.scale() || {x:1, y: 1}
    const {x:poxX, y:poxY} = this._stage.position()
    const scale = (this.config.minimap as MinimapConfig).scale ?? 0.2
    this._minimapStage.scale({x: x * scale, y: y * scale})
    this._minimapStage.position({x: poxX * scale, y: poxY * scale})
    // this.#minimapLayer.destroy()
    // this.#minimapLayer = this.#layer.clone({ listening: false })
    // this.#minimapStage.add(this.#minimapLayer)

    // we just need to update ALL nodes in the preview
    this._layer.children.forEach((shape) => {
      let clone
      if(shape.id()) {
        clone = this._minimapLayer!.findOne('#' + shape.id())
      } else if (shape.name()) {
        clone = this._minimapLayer!.findOne('.' + shape.name())
      }
      // update its position from the original
      if (clone) {
        clone.position(shape.position())
        clone.scale(shape.scale())
      }
    })
    const gridLineH = this._layer.findOne<Line>('#grid-h')
    if (gridLineH) {
      this._minimapLayer!.findOne<Line>('#grid-h')!.points((gridLineH).points())
    }
    const gridLineV = this._layer.findOne<Line>('#grid-v')
    if (gridLineV) {
      this._minimapLayer!.findOne<Line>('#grid-v')!.points((gridLineV).points())
    }
  }

  #scaleByPoint(pointer: Vector2d, newScale: number): void {
    const oldScale = this._stage.scaleX()
    newScale = Math.min(Math.max(this.config.minZoom, Math.round(newScale * 1000) / 1000), this.config.maxZoom)
    if(newScale === oldScale) {
      return
    }

    const mousePointTo = {
      x: (pointer.x - this._stage.x()) / oldScale,
      y: (pointer.y - this._stage.y()) / oldScale,
    }

    this._stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    this._stage.position(newPos)

    // 滚动滚轮时, 整个stage的位置都发生变化, grid的位置也随之改变
    if (this._grid) {
      this._gridLastPosition = this._grid.absolutePosition()
      this.#updateGridPoints()
    } 

    if (this._background) {
      this._background.absolutePosition({ x: 0, y: 0 })
      this._background.scale({ x: 1 / newScale, y: 1 / newScale })
    }

    if (this._minimapLayer && this._minimapStage) {
      this.#updateMinimap()
    }
  }

  scale(scale: number, center?: boolean): boolean {
    if (scale >= this.config.minZoom && scale <= this.config.maxZoom) {
      const s = Math.round(scale * 100) / 100 
      if (center) {
        this.#scaleByPoint({x: this._width / 2, y: this._height / 2}, s)
      } else {
        this.#scaleByPoint({x: 0, y: 0}, s)
      }
      return true
    }
    return false
  }

  updateNode(id: string, path: string, value: any) {
    const nodeInstance = this._nodeInstanceMap.get(id)
    if (!nodeInstance) return
    nodeInstance.update(path, value)
  }

  deleteNode(id: string) {
    if (this.hasNode(id)) {
      // TODO 移动该node后所有node的位置, 并重新计算 contentRect
      this.deleteChainItem(id)
      this.updateLayerEdges()
      this.updateLayerNodes()
    }
  }

  deleteComboNode(nodeOrId: string | Node) {
    const node = typeof nodeOrId === 'string' ? this._nodeInstanceMap.get(nodeOrId) : nodeOrId
    console.log(node)
  }

  updateLayerNodes() {
    const nodeGroups = this._layer.findOne<Group>('#nodes-group')

    nodeGroups?.children.forEach(node => {
      const id = node.id().match(/^node-(.+)-group$/)?.[1]
      if (!id) {
        return
      }
      if (!this.hasNode(id)) {
        requestAnimationFrame(() => {
          node.remove()
        })
        return
      }
      const nodeCfg = this.getNodeShape(id)!
      if (node.x() !== nodeCfg.rect.x) {
        node.x(nodeCfg.rect.x)
      }
      if (node.y() !== nodeCfg.rect.y) {
        node.y(nodeCfg.rect.y)
      }
    })
  }

  // TODO arrange.layout(['A', 'B']) 整体更新链路
  // layout(cfg: {layout?: LayoutItem[], showAdd: boolean}): void {}
}