import { ArrangeEvent } from './ArrangeEvent'
import { Combo } from './item/Combo'
import { ComboNormal } from './item/ComboNormal'
import { Edge } from './item/Edge'
import { EdgeLine } from './item/EdgeLine'
import { ItemBase } from './item/Item'
import { Node } from './item/Node'
import { NodeAdd } from './item/NodeAdd'
import { NodeCircle } from './item/NodeCircle'
import { NodeNormal } from './item/NodeNormal'

type NodeItem = string // { id: string, type: 'single' | 'double'}

export type LayoutItem = NodeItem | (NodeItem | NodeItem[])[]

type ChainEnd = {
  type: 'end',
  id: 'end',
  prev: ChainStart | ChainSingle | ChainGroup | ChainAdd,
  next: null,
}
type ChainAdd = {
  type: 'add',
  id: string,
  prev: ChainStart | ChainSingle | ChainGroup,
  next: ChainSingle | ChainGroup | ChainEnd,
}
type ChainSingle = {
  type: 'single',
  id: string,
  prev: ChainStart | ChainSingle | ChainGroup | ChainAdd,
  next: ChainSingle | ChainGroup | ChainEnd | ChainAdd,
}
type ChainGroupSingle = {
  type: 'groupSingle',
  id: string,
  parent: ChainGroup,
  prev: null | ChainGroupAdd | ChainGroupSingle,
  next: null | ChainGroupAdd | ChainGroupSingle,
}
type ChainGroupAdd = {
  type: 'groupAdd',
  id: string,
  parent: ChainGroup,
  prev: null | ChainGroupSingle,
  next: null | ChainGroupSingle,
}
type ChainGroup = {
  type: 'group',
  id: string,
  prev: ChainStart | ChainSingle | ChainGroup | ChainAdd,
  next: ChainSingle | ChainGroup | ChainEnd | ChainAdd,
  rows: (ChainGroupAdd | ChainGroupSingle)[][]
}
type ChainStart = {
  type: 'start',
  id: 'start',
  prev: null,
  next: ChainAdd | ChainSingle | ChainGroup | ChainEnd
}
type ChainItem = ChainStart | ChainAdd | ChainSingle | ChainGroup | ChainEnd
type SizeType = ChainStart['type'] | ChainAdd['type'] | ChainSingle['type'] | ChainEnd['type'] | 'groupAdd' | 'groupSingle'
type Chain = {
  start: ChainStart
  end: ChainEnd
}

type Config = {
  layout: LayoutItem[],
  showAdd?: boolean,
  equidistant?: boolean,
  gapH?: number,
  gapV?: number,
}

export type NodeShape = {
  id: string,
  type: 'start' | 'add' | 'single' | 'end',
  rect: {x: number, y: number, width: number, height: number},
} | {
  id: string,
  type: 'group',
  rect: {x: number, y: number, width: number, height: number},
  rows: {id: string, type: 'groupSingle' | 'groupAdd', parent: string, rect: {x: number, y: number, width: number, height: number}}[][]
}
export type EdgeShape = {id: string, source: string, target: string}

export class ArrangeGraph extends ArrangeEvent {
  #layout: LayoutItem[]
  #showAdd: boolean
  #equidistant: boolean
  #gapH: number
  #gapV: number
  #chain: Chain
  
  constructor(config: Config) {
    super()

    this.#showAdd = !!config.showAdd
    this.#equidistant = !!config.equidistant
    this.#gapH = config.gapH ?? 100
    this.#gapV = config.gapV ?? 40
    // 后续改成deep clone
    try {
      this.#layout = JSON.parse(JSON.stringify(config.layout))
    } catch (error) {
      this.#layout = config.layout      
    }

    // 1. layout -> chain
    const start = { type: 'start', id: 'start', prev: null, next: null} as unknown as ChainStart
    const end = { type: 'end', id: 'end', prev: start, next: null} as ChainEnd
    start.next = end
    this.#chain = {start, end}
    if (this.#layout.length > 0) {
      this.#initChain()
    } else if (this.#showAdd) {
      const add: ChainAdd = { type: 'add', id: this.#addId(), prev: start, next: null} as unknown as ChainAdd
      start.next = add
      add.next = end
      end.prev = add
    }
    this.#toString()

    // 2. 实例化 chain item
    this._genItemsMap()

    // 3. chain -> items rect map
    this.#layoutChain()
  }

  #_itemsMap: Map<string, Edge | Node | Combo> = new Map()
  _genItemsMap() {
    this.#forEachChain((current) => {
      switch (current.type) {
      case 'start':{
        const node = new NodeCircle({id: current.id, label: '开始' })
        this.#_itemsMap.set(current.id, node)
        break
      }
      case 'end': {
        const node = new NodeCircle({id: current.id, label: '结束' })
        this.#_itemsMap.set(current.id, node)
        break
      }
      case 'add': {
        const node = new NodeAdd({id: current.id })
        this.#_itemsMap.set(current.id, node)
        break
      }
      case 'group': {
        const node = new ComboNormal({id: current.id, rows: current.rows})
        this.#_itemsMap.set(current.id, node)
        break
      }
      case 'single': {
        const node = new NodeNormal({ id: current.id })
        this.#_itemsMap.set(current.id, node)
        break
      }
      default:
        break
      }
    })
    // this._itemsMap.set()
  }

  #initChain() {
    let latest: ChainStart | ChainSingle | ChainAdd | ChainGroup = this.#chain.start
    this.#layout.forEach((item, index) => {
      if (Array.isArray(item)) {
        if (this.#showAdd) {
          const add: ChainAdd = { type: 'add', id: this.#addId(), prev: latest, next: null} as unknown as ChainAdd
          latest.next = add
          latest = add
        }
        const group = { type: 'group', id: `group${index}`, prev: latest, next: null, rows: []} as unknown as ChainGroup 
        group.rows = item.map<(ChainGroupSingle | ChainGroupAdd)[]>(_rows => {
          const rows = Array.isArray(_rows) ? _rows : [_rows]

          let rowLatest: ChainGroupSingle | ChainGroupAdd | null = null
          return rows.flatMap((rItem, rIndex, arr) => {
            const result = []
            if (this.#showAdd) {
              const add: ChainGroupAdd = { type: 'groupAdd', id: this.#addId(), prev: rowLatest, next: null, parent: group} as ChainGroupAdd
              if (rowLatest) {
                rowLatest.next = add
              }
              rowLatest = add
              result.push(add)
            }
            const gSingle: ChainGroupSingle = { type: 'groupSingle', id: rItem, prev: rowLatest, next: null, parent: group}
            if (rowLatest) {
              rowLatest.next = gSingle
            }
            rowLatest = gSingle
            result.push(gSingle)
            if (rIndex === arr.length - 1 && this.#showAdd) {
              const add: ChainGroupAdd = { type: 'groupAdd', id: this.#addId(), prev: rowLatest, next: null, parent: group} as ChainGroupAdd
              if (rowLatest) {
                rowLatest.next = add
              }
              rowLatest = add
              result.push(add)
            }
            return result
          })
        })
        latest.next = group
        latest = group
      } else {
        if (this.#showAdd) {
          const add: ChainAdd = { type: 'add', id: this.#addId(), prev: latest, next: null} as unknown as ChainAdd
          latest.next = add
          latest = add
        }
        const single = { type: 'single', id: item, prev: latest, next: null} as unknown as ChainSingle
        latest.next = single
        latest = single
      }  
    })
    if (this.#showAdd) {
      const add: ChainAdd = { type: 'add', id: this.#addId(), prev: latest, next: null} as unknown as ChainAdd
      latest.next = add
      latest = add
    }
    latest.next = this.#chain.end
    this.#chain.end.prev = latest
  }

  static TYPE_SIZE: Record<SizeType, [number, number]> = {
    'add': [32, 32],
    'start': [48, 48],
    'single': [72, 72],
    'end': [48, 48],
    'groupAdd': [32, 32],
    'groupSingle': [72, 72],
  }

  #layoutChain() {
    let endX = 100
    let startY = 100

    // 沿着 #chain 遍历整条链路, 根据不同类型计算其尺寸, 从左到右排布链路 
    this.#forEachChain((current, index) => {
      // 1. 尺寸计算
      const instance = this.#_itemsMap.get(current.id) as Node | Combo
      const [width, height] = instance.getSize()

      let x: number
      // 等间距: 根据节点尺寸动态调整间距, 使间距相同 +---XXX---+---X---
      // 非等距: 节点中心点之间的固定间距, 尺寸大的节点两侧间距会偏小 +--XXX--+---X---
      if (this.#equidistant) {
        x = index === 0 ? endX : (endX + this.#gapH + width / 2)
        endX = x + width / 2
      } else {
        x = index === 0 ? endX : (current.type === 'group' ? (endX + this.#gapH + width / 2) : (endX + this.#gapH))
        endX = current.type === 'group' ? (x + width / 2): x
      }

      // 2. 排布定位
      // const pos = [x, startY]
      instance.pos(x, startY)

      // 3. 生成 items map
      // if (current.type === 'group') {
      //   this.#nodeMap.set(current.id, {
      //     id: current.id,
      //     type: current.type,
      //     rect: {x: pos[0], y: pos[1], width, height},
      //     rows: current.rows.map((row, rIndex, rowArr) => {
      //       const isOdd = row.length % 2 === 1 // 奇数行
      //       return row.map((item, index, arr) => ({
      //         id: item.id,
      //         type: item.type,
      //         parent: item.parent.id, 
      //         rect: {
      //           x: index === arr.length - 1 ? (width - this.#gapH * index) / 2 + this.#gapH * index : this.#gapH * (index + 1),
      //           y: isOdd ? (this.#gapV + 72) * (rIndex - (rowArr.length - 1) / 2) : (this.#gapV + 72) * (rIndex - (rowArr.length - 1) / 2),
      //           width: ArrangeGraph.TYPE_SIZE[item.type][0],
      //           height: ArrangeGraph.TYPE_SIZE[item.type][1],
      //         }}))
      //     })
      //   })
      // } else {
      //   this.#nodeMap.set(current.id, {
      //     id: current.id,
      //     type: current.type,
      //     rect: {x: pos[0], y: pos[1], width, height},
      //   })
      // }
      
      if (current.prev) {
        const source = this.#getItemInstance(current.prev.id)
        const target = this.#getItemInstance(current.id)
        if (!source || !target) {
          return
        }
        if (source.itemType === 'edge' || target.itemType === 'edge') {
          return
        }
        const id = this.#edgeId()
        const line = new EdgeLine({ id, source, target })
        this.#_itemsMap.set(id, line)
      }
    })
  }

  #edgeIndex = 0
  #edgeId() {
    return `edge:${this.#edgeIndex++}`
  }

  #addIndex = 0
  #addId() {
    return `add:${this.#addIndex++}`
  }

  #forEachChain(callbackfn: (current: ChainItem, index: number) => unknown) {
    let current: ChainItem | null = this.#chain.start
    let index = 0
    while (current) {
      const rt = callbackfn(current, index)
      if (rt === false) {
        break
      }
      index ++
      current = current.next
    }
  }

  #toString() {
    let logId = ''
    // let logPos = ''
    this.#forEachChain((current) => {
      switch (current.type) {
      case 'start':{
        logId += `(${current.id})`
        // logPos += `(${rect?.x})`
        break
      }
      case 'single':{
        logId += `[${current.id}]`
        // logPos += `[${rect?.x}]`
        break
      }
      case 'add':{
        logId += `<${current.id.slice(4)}>`
        // logPos += `<${rect?.x}>`
        break
      }
      case 'group':{
        logId += `{${current.id}}`
        // logPos += `{${rect?.x}}`
        break
      }
      case 'end':{
        logId += `(${current.id})`
        // logPos += `(${rect?.x})`
        break
      }
          
      default:
        break
      }
      if (current.next) {
        logId += '->'
        // logPos += '->'
      }
    })
    console.log(logId)
  }

  /**
   * 删除链路中的一个普通节点
   * 1. 遍历移除指定节点, (及后方可能存在的add节点)
   * A + B + C
   * A +     C
   * 2. 从被删除的节点往后, 重新计算每个节点的位置
   * 3. 重新生成连线
   */
  deleteChainItem(id: string) {
    if (!this.#_itemsMap.has(id)) {
      return
    }
    const node = this.#_itemsMap.get(id)
    if (node?.itemType !== 'node') {
      return
    }

    let reLayout = false
    let endX: number
    this.#forEachChain((current) => {
      // if (!this. .has(current.id)) {
      //   return
      // }
      if (current.id === id) {
        if (current.type === 'single' || current.type === 'group') {
          // 1.
          node.destroy()
          this.#_itemsMap.delete(current.id)
          this.#deleteEdge(current.id, current.next.id)

          const prev = current.prev
          let next: ChainSingle | ChainGroup | ChainEnd
          if (this.#showAdd && current.next.type === 'add') {
            next = current.next.next
            node.destroy()
            this.#_itemsMap.delete(current.next.id)
            this.#deleteEdge(current.next.id, next.id)
          } else {
            next = current.next as ChainSingle | ChainGroup | ChainEnd
          }
          prev.next = next
          next.prev = prev
          const edge = this.#findEdge(prev.id, current.id)!
          edge.target = next.id
          // 2.
          reLayout = true
          const from = (this.#_itemsMap.get(prev.id) as (Node | Combo)).getRect()
          endX = from.x + from.width / 2
        }
        return
      }
      if (reLayout) {
        const currentInstance = this.#_itemsMap.get(current.id) as (Node | Combo)
        const rect = currentInstance.getRect()
        endX = endX + this.#gapH + rect.width
        currentInstance.posX(endX)
      }
    })
  }

  #findEdge(source: string, target: string): {id: string, source: string, target: string}|undefined {
    const items = Array.from(this.#_itemsMap.values())
    const edges = items.filter(item => item.itemType === 'edge') as Edge[]

    for (const edge of this.#_itemsMap.values()) {
      if(edge.source === source && edge.target === target) {
        return edge
      }
    } 
  }

  // 根据位置, 尺寸生成 nodes 和 edges
  getItems() {
    const items = Array.from(this.#_itemsMap.values())
    return {
      nodes: items.filter(item => item.itemType === 'node' || item.itemType === 'combo' ) as (Node | Combo)[],
      edges: items.filter(item => item.itemType === 'edge' ) as Edge[],
    }
  }
  #getItemInstance(id: string) {
    return this.#_itemsMap.get(id)
  }
  hasNode(id: string) {
    return this.#_itemsMap.has(id)
  }
  hasEdge(id: string) {
    return this.#edgeMap.has(id)
  }
  getNodeShape(id: string) {
    return this.#_itemsMap.get(id)
  }
  getEdgeShape(id: string) {
    return this.#edgeMap.get(id)
  }
}

