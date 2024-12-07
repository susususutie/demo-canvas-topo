import { useCallback, useEffect, useRef, useState } from 'react'
import DevHelper from './DevHelper.tsx'
import { Arrange } from './DrccLinkArrange'
import { Dropdown } from 'antd'

type LinkArrangeProps = {
  width: number
  height: number
}
export type LayoutItem = string | string[][]
const layout: LayoutItem[] = ['A', 'B', [['C1'], ['C2']], 'D', [['E1'], ['F1', 'F2'], ['G']]]

export default function LinkArrange(props: LinkArrangeProps) {
  const { width, height } = props

  const instance = useRef<Arrange>()
  const config = useRef({ width, height })
  const wrapper = useRef<HTMLDivElement>(null)
  const minimap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const arrange = new Arrange({
      container: wrapper.current!,
      // minimap: {
      //   container: minimap.current!,
      //   scale: 0.2,
      // },
      width: config.current.width,
      height: config.current.height,
      layout,
      background: '#fff',
      pan: true,
      zoom: true,
      dev: false,
    })
    instance.current = arrange
    ;(window as any).test = {
      downloadPNG: () => arrange.downloadPNG(),
      preview: () => {
        setPreview(arrange.getPreview())
      },
      resize: (w: number, h: number) => arrange.resize(w, h),
      scale: (s: number) => arrange.scale(s),
    }

    arrange.on('node:click', ev => {
      console.log('click node', ev)
      const node = ev.item
      if (node?.combo) {
        if (ev.shapeName === 'node-delete') {
          arrange.deleteComboNode(ev.item)
          return
        }
      } else {
        if (ev.shapeName === 'node-delete') {
          arrange.deleteNode(ev.item.id)
          return
        }
        if (ev.item.type === 'add') {
          console.log('add')
        }
      }
    })
    arrange.on('edge:click', ev => {
      console.log('click edge', ev)
    })
    let timer: number
    arrange.on('node:mouseenter', ev => {
      if (ev.shapeName === 'action') {
        const { x, y, width, height } = ev.shape.getClientRect()
        clearTimeout(timer)
        setActionPop({
          open: true,
          trigger: { left: x, top: y, width, height },
          menu: [
            { key: `${ev.item.id}|open`, label: '打开' },
            { key: `${ev.item.id}|close`, label: '关闭' },
            { key: `${ev.item.id}|self`, label: ev.item.id },
          ],
        })
      }
    })
    arrange.on('node:mouseleave', ev => {
      if (ev.shapeName === 'action') {
        timer = setTimeout(() => {
          setActionPop({ open: false, trigger: { left: 0, top: 0, width: 0, height: 0 }, menu: [] })
        }, 100)
      }
    })

    let needClose = false
    document.addEventListener('mousemove', ev => {
      if (!actionDropdownOpen.current) return
      if (ev.target && document.querySelector('.node-action-dropdown')?.contains(ev.target as HTMLElement)) {
        if (timer) {
          needClose = true
          clearTimeout(timer)
        }
      } else {
        if (needClose) {
          needClose = false
          setActionPop(state => ({ ...state, open: false }))
        }
      }
    })

    return () => {
      arrange.destroy()
      instance.current = undefined
    }
  }, [])

  const [preview, setPreview] = useState('')
  const [previewAll, setPreviewAll] = useState('')
  const [scale, setScale] = useState(1)

  const [actionPop, setActionPop] = useState({
    open: false,
    trigger: { left: 0, top: 0, width: 72, height: 32 },
    menu: [{ key: '', label: '' }],
  })
  const actionDropdownOpen = useRef(false)
  actionDropdownOpen.current = actionPop.open
  const handleMenuClick = useCallback((ev: { key: string }) => {
    const [id, key] = ev.key.split('|')
    console.log(id, key)
    switch (key) {
      case 'open': {
        instance.current?.updateNode(id, 'action', '打开')
        break
      }
      case 'close': {
        instance.current?.updateNode(id, 'action', '关闭')
        break
      }
      default:
        break
    }
  }, [])

  return (
    <div>
      <div className='flex flex-row flex-items-start'>
        <p>
          <button
            onClick={() => {
              const s = Math.round(scale * 100 + 10) / 100
              const success = instance.current?.scale(s, true)
              if (success) {
                setScale(s)
              }
            }}
          >
            +
          </button>
          <span>{scale}</span>
          <button
            onClick={() => {
              const s = Math.round(scale * 100 - 10) / 100
              const success = instance.current?.scale(s, true)
              if (success) {
                setScale(s)
              }
            }}
          >
            -
          </button>
        </p>
        <button onClick={() => setPreview(instance.current!.getPreview())}>preview</button>
        <button onClick={() => setPreviewAll(instance.current!.previewAll())}>preview all</button>
        <DevHelper data={layout} />
        <img src={preview} alt='preview' className='w-300px h-auto border border-lime border-solid' />
        <img src={previewAll} alt='preview' className='w-300px h-auto border border-lime border-solid max-h-300px' />
      </div>
      <div className='flex flex-items-center relative'>
        <div ref={wrapper} className='shrink-0 border border-lime border-solid'></div>
        <div ref={minimap} className='m-l-4 border border-lime border-solid'></div>

        <Dropdown
          rootClassName='node-action-dropdown'
          open={actionPop.open}
          placement='bottom'
          menu={{ items: actionPop.menu.map(item => ({ key: item.key, label: item.label, onClick: handleMenuClick })) }}
        >
          <span className='absolute pointer-events-none' style={actionPop.trigger} />
        </Dropdown>
      </div>
    </div>
  )
}
