/* eslint-disable no-unused-vars */

type Pos = { x: number; y: number }
type ClientRect = { width: number; height: number; left: number; top: number; x: number; y: number }
type MarginRect = { width: number; height: number; left: number; top: number }

export interface AbstractNode {
  getId(): string
  getStatus(): 'IDLE' | 'READY'
  setPos(pos: Partial<Pos>): void
  getClientRect(): ClientRect
  getMarginRect(): MarginRect
  draw(ctx: CanvasRenderingContext2D): void
}

interface PainterData {
  nodes: { id: string; type: 'single'; icon: string; text: string; name: string }[]
  links: { source: string; target: string }[]
}
