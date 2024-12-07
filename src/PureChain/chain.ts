type NItem = { id: string; type?: string; data?: any }
type GItem = NItem[][]
type InputItem = NItem | GItem
type InputItems = InputItem[]
function isGItem(item: InputItem): item is GItem {
  return Array.isArray(item)
}

const nodes: InputItems = [
  { id: 'start', type: 'circle', data: {} },
  { id: 'a', type: 'single', data: {} },
  { id: 'b', type: 'double', data: {} },
  [
    [
      { id: 'c1', type: 'single', data: {} },
      { id: 'c2', type: 'double', data: {} },
    ],
    [{ id: 'c3', type: 'single', data: {} }],
  ],
  { id: 'end', type: 'circle', data: {} },
]

// 内部使用
type Shape = { x: number; y: number; width: number; height: number }
type InnerNItem = { id: string; type: string; shape: Shape; data: Record<string, any> }
type InnerGItem = { id: string; type: 'group'; shape: Shape; data: Record<string, any>; rows: InnerNItem[][] }
type InnerItem = InnerNItem | InnerGItem
type InnerItems = InnerItem[]
function isInnerGItem(item: InnerItem): item is InnerGItem {
  return item.type === 'group'
}

const INIT_SHAPE = { x: 0, y: 0, width: 20, height: 20 }
function initNodes(nodes: InputItems): InnerItems {
  let gIndex = 0
  return nodes.map(item => {
    if (isGItem(item)) {
      return {
        id: `group${gIndex++}`,
        type: 'group',
        data: {},
        shape: { ...INIT_SHAPE },
        rows: item.map(rItem =>
          rItem.map(cItem => ({
            id: cItem.id,
            type: cItem.type || 'single',
            shape: { ...INIT_SHAPE },
            data: { ...cItem.data },
          }))
        ),
      }
    } else {
      return { id: item.id, type: item.type || 'single', shape: { ...INIT_SHAPE }, data: { ...item.data } }
    }
  })
}

function insertEach(nodes: InnerItems, item: () => InnerNItem): InnerItems {
  function insertInnerGItem(cItem: InnerGItem): InnerGItem {
    return {
      ...cItem,
      rows: cItem.rows.map(row =>
        row.flatMap((node, index) => (index === 0 ? [item(), node, item()] : [node, item()]))
      ),
    }
  }
  return nodes.flatMap((node, index, arr) => {
    if (isInnerGItem(node)) {
      return index === arr.length - 1 ? [insertInnerGItem(node)] : [insertInnerGItem(node), item()]
    } else {
      return index === arr.length - 1 ? [node] : [node, item()]
    }
  })
}

type LayoutCfg = { startX: number; startY: number; gapH: number; gapV: number }
function layoutChain(nodes: InnerItems, cfg: LayoutCfg) {
  let lastX = cfg.startX

  nodes.forEach(item => {
    if (isInnerGItem(item)) {
      const cNode = item
      const maxCols = Math.max(...cNode.rows.map(row => row.length))
      const width = maxCols * cfg.gapH
      const height = (cNode.rows.length - 1) * cfg.gapV
      const pointTopLeft = [lastX + cfg.gapH / 2, cfg.startY - cfg.gapV / 2]
      cNode.rows.forEach((row, rowIndex) => {
        const rowY = pointTopLeft[1] + rowIndex * cfg.gapV

        // 居中对齐
        // const rowSize = row.length
        // if (rowSize === 1) {
        //   row[0].shape.x = pointTopLeft[0] + width / 2
        //   row[0].shape.y = rowY
        // } else if (rowSize === maxCols) {
        //   row.forEach((node, nodeIndex) => {
        //     node.shape.x = pointTopLeft[0] + cfg.gapH / 2 + nodeIndex * cfg.gapH
        //     node.shape.y = rowY
        //   })
        // } else {
        //   // ----+----+----
        // }

        // 左对齐
        row.forEach((node, nodeIndex) => {
          node.shape.x = pointTopLeft[0] + cfg.gapH / 2 + nodeIndex * cfg.gapH
          node.shape.y = rowY
          node.shape.width = { circle: 50, single: 72, double: 90, add: 32 }[node.type ?? 'single'] || 20
          node.shape.height = { circle: 50, single: 72, double: 72, add: 32 }[node.type ?? 'single'] || 20
        })
      })

      cNode.shape.x = lastX + width / 2 + cfg.gapH / 2
      cNode.shape.y = cfg.startY
      cNode.shape.width = width
      cNode.shape.height = height
      lastX = lastX + width
    } else {
      const node = item
      node.shape.x = lastX + cfg.gapH
      node.shape.y = cfg.startY
      node.shape.width = { circle: 50, single: 72, double: 90, add: 32 }[node.type ?? 'single'] || 20
      node.shape.height = { circle: 50, single: 72, double: 72, add: 32 }[node.type ?? 'single'] || 20
      lastX = node.shape.x
    }
  })

  return nodes
}

function genEdge(nodes: InnerItems): [number, number, number, number][] {
  const edges: [number, number, number, number][] = []
  nodes.forEach((node, index, arr) => {
    const next = arr[index + 1]
    if (!next) return

    if (isInnerGItem(node)) {
      const shape = node.shape
      const x = [shape.x - shape.width / 2, shape.x + shape.width / 2]
      const y = [shape.y - shape.height / 2, shape.y + shape.height / 2]

      edges.push([x[0], y[0], x[0], y[1]])
      edges.push([x[1], y[0], x[1], y[1]])

      node.rows.forEach(row => {
        row.forEach((iNode, idx, iArr) => {
          const iShape = iNode.shape
          // --x0----x1----x2--
          if (idx === 0) {
            edges.push([x[0], iShape.y, iShape.x - iShape.width / 2, iShape.y])
          }
          const iNext = iArr[idx + 1]
          if (iNext) {
            const iNextShape = iNext.shape
            edges.push([iShape.x + iShape.width / 2, iShape.y, iNextShape.x - iNextShape.width / 2, iNextShape.y])
          } else {
            edges.push([iShape.x + iShape.width / 2, iShape.y, x[1], iShape.y])
          }
        })
      })
    } else {
      edges.push([node.shape.x + node.shape.width / 2, node.shape.y, next.shape.x - next.shape.width / 2, next.shape.y])
    }
  })
  return edges
}

let refresh = true
function render() {
  console.log('nodes', nodes)

  const innerNodes = initNodes(nodes)
  console.log('innerNodes', innerNodes)

  let insertIndex = 0
  const getInsertItem = () => ({ id: `add${insertIndex++}`, type: 'add', shape: { ...INIT_SHAPE }, data: {} })
  const insertedNodes = insertEach(innerNodes, getInsertItem)
  console.log('insertedNodes', insertedNodes)

  const layoutCfg: LayoutCfg = { startX: 0, startY: 0, gapH: 100, gapV: 40 }
  const layoutNodes = layoutChain(insertedNodes, layoutCfg)
  console.log('layoutNodes', layoutNodes)

  const edges = genEdge(layoutNodes)
  console.log('edge', edges)
}

// setInterval(() => {
//   if (refresh) {
//     render()
//     refresh = false
//   }
// }, 30)

/**
 *  只用来表示节点的连接关系, 不关心布局
 *
 *
 */
class DoublyLinkedList {
  head: LinkedListNode
  tail: LinkedListNode
  length: number = 0

  constructor(list: (string | (string | string[])[])[]) {
    if (list.length === 0) throw Error('DoublyLinkedList.list > 0')
    this.length = list.length

    const first = list[0]
    const last = list[list.length - 1]
    if (typeof first !== 'string') throw Error('链路第一个必须为单节点')
    if (typeof last !== 'string') throw Error('链路最后一个必须为单节点')

    this.head = new LinkedListNode(first)
    this.tail = list.length > 1 ? new LinkedListNode(last) : this.head

    if (list.length === 2) {
      this.head.next = this.tail
      this.tail.prev = this.head
    }

    if (list.length > 2) {
      let prev: LinkedListNode | LinkedListParallel = this.head
      list.forEach((item, index, arr) => {
        if (index !== 0 && index !== arr.length - 1) {
          //
          let nodeItem: LinkedListNode | LinkedListParallel
          if (typeof item === 'string') {
            nodeItem = new LinkedListNode(item)
          } else {
            const parallel = item.map(row => {
              const _list = typeof row === 'string' ? [row] : row
              return new SimpleList(_list)
            })
            nodeItem = new LinkedListParallel(parallel)
          }
          prev.next = nodeItem
          nodeItem.prev = prev
          prev = nodeItem
        }
        if (index === arr.length - 1) {
          prev.next = this.tail
          this.tail.prev = prev
        }
      })
    }
  }

  forwardString() {
    let str = this.head.item
    let next: LinkedListNode | LinkedListParallel | null = this.head.next
    while (next) {
      if (next instanceof LinkedListNode) {
        str += `===>${next.toString()}`
      } else {
        str += `===>[${next.forwardString()}]`
      }
      next = next.next
    }
    return str
  }

  backwardString() {
    let str = this.tail.item
    let prev: LinkedListNode | LinkedListParallel | null = this.tail.prev
    while (prev) {
      if (prev instanceof LinkedListNode) {
        str += `===>${prev.toString()}`
      } else {
        str += `===>[${prev.backwardString()}]`
      }
      prev = prev.prev
    }
    return str
  }

  /** size 和 length 不同, length仅表示长度, 一个并行节点只算一个长度, size则统计了并行中的子节点数量 */
  size() {
    let count = 0
    let next: LinkedListNode | LinkedListParallel | null = this.head
    while (next) {
      count += next.size()
      next = next.next
    }
    return count
  }
}

/** A */
class SimpleNode {
  prev: SimpleNode | null = null
  item: string
  next: SimpleNode | null = null
  constructor(item: string, prev: SimpleNode | null = null, next: SimpleNode | null = null) {
    this.item = item
    this.prev = prev
    this.next = next
  }
}

/** 简单的串联链路 -A- */
class SimpleList {
  head: SimpleNode | null
  tail: SimpleNode | null
  length: number = 0

  constructor(list: string[]) {
    if (list.length === 0) throw Error('链路中至少有一个节点')
    this.length = list.length

    this.head = new SimpleNode(list[0])
    this.tail = list.length > 1 ? new SimpleNode(list[list.length - 1]) : this.head

    if (list.length === 2) {
      this.head.next = this.tail
      this.tail.prev = this.head
    }

    if (list.length > 2) {
      let prev = this.head
      list.forEach((item, index, arr) => {
        if (index !== 0 && index !== arr.length - 1) {
          const node = new SimpleNode(item)
          prev.next = node
          node.prev = prev
          prev = node
        }
        if (index === arr.length - 1) {
          prev.next = this.tail
          ;(this.tail as SimpleNode).prev = prev
        }
      })
    }
  }

  forwardString() {
    if (!this.head) return ''
    let str = this.head.item
    let next: SimpleNode | null = this.head.next

    while (next) {
      str += `->${next.item}`
      next = next.next
    }
    return str
  }

  backwardString() {
    if (!this.tail) return ''
    let str = this.tail.item
    let prev: SimpleNode | null = this.tail.prev

    while (prev) {
      str += `->${prev.item}`
      prev = prev.prev
    }
    return str
  }

  size() {
    return this.length
  }

  remove(simpleNode: SimpleNode) {
    // TODO
    if (this.length === 0) return false
    if (this.length === 1) {
      if (this.head === simpleNode) {
        this.head = null
        this.tail = null
        this.length = 0
      }
    }
    if (this.length === 2) {
      if (this.head === simpleNode) {
        this.head = this.tail as SimpleNode
        this.head.prev = null
        this.head.next = null
        this.length = 1
      }
      if (this.tail === simpleNode) {
        this.tail = this.head as SimpleNode
        this.tail.prev = null
        this.tail.next = null
        this.length = 1
      }
    }

    let current: SimpleNode | null = this.head
    while (current) {
      if (current === simpleNode) {
        if (current.prev) {
          current.prev.next = current.next
        }
        if (current.next) {
          current.next.prev = current.prev
        }
        this.length = this.length - 1
        return true
      }
      current = current.next
    }
    return false
  }
}

/**
 * 多个简单串联链路组成的并联链路
 *  --A--   --A--
 *  --B--   -B-C-
 */
class LinkedListParallel {
  prev: LinkedListNode | LinkedListParallel | null
  item: SimpleList[]
  next: LinkedListNode | LinkedListParallel | null
  constructor(
    parallel: SimpleList[],
    prev: LinkedListNode | LinkedListParallel | null = null,
    next: LinkedListNode | LinkedListParallel | null = null
  ) {
    this.item = parallel
    this.prev = prev
    this.next = next
  }

  forwardString() {
    return this.item.map(simpleList => simpleList.forwardString()).join(', ')
  }

  backwardString() {
    return this.item.map(simpleList => simpleList.backwardString()).join(', ')
  }

  size() {
    return this.item.reduce((result, simpleList) => result + simpleList.size(), 0)
  }
}

class LinkedListNode {
  prev: LinkedListNode | LinkedListParallel | null = null
  item: string
  next: LinkedListNode | LinkedListParallel | null = null
  constructor(
    item: string,
    prev: LinkedListNode | LinkedListParallel | null = null,
    next: LinkedListNode | LinkedListParallel | null = null
  ) {
    this.item = item
    this.prev = prev
    this.next = next
  }
  toString() {
    return this.item
  }
  size() {
    return 1
  }
}

/**
 * SimpleNode => SimpleList => LinkedListParallel
 *                                                 => LinkedList
 *                                 LinkedListItem
 * todo: https://juejin.cn/post/6930978110993072135
 * append(element)：向链表尾部添加一个新的项
 * insert(position,element):向链表的特定位置插入一个新的项
 * get(position):获取对应位置的元素
 * indexOf(element):返回元素在列表上的索引。如果链表上没有该元素则返回-1
 * updata（position，element）：更新某个元素
 * removeAt（position）：从链表的特定位置移除一项（根据位置）
 * remove(element);从链表移除一项（根据元素）
 * isEmpty():如果链表中不包含任何元素，返回true，如果链表长度大于0则返回false。
 * size():返回链表包含的元素个数。
 * tostring():输出
 * forwardString():返回正向遍历的节点字符串形式
 * backwardString():返回正向遍历的节点字符串形式
 */

// const pureChain = new DoublyLinkedList([
//   '1', // string
//   '2',
//   ['31', '32'], // string[]
//   '4',
//   ['51', ['521', '522', '523'], ['541', '542']], // (string|string[])[]
//   '6'
// ])

const list = new SimpleList(['a', 'b', 'c'])
console.log(list, list.forwardString())
console.log(list.remove(list.head!))
console.log(list, list.forwardString())
