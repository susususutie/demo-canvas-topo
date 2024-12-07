import Painter from './Painter'

const demoIcon =
  'data:image/png;base64,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'

const painter = new Painter(
  {
    nodes: Array.from({ length: 300 }, (_, index) => ({
      id: `${index}`,
      type: 'single',
      icon: demoIcon,
      text: Math.random().toString(34).slice(2),
      name: 'name',
    })),
    links: Array.from({ length: 300 - 1 }, (_, index) => ({ source: `${index}`, target: `${index + 1}` })),
  },
  true
)

const button = document.createElement('button')
button.innerText = '加载中'
button.addEventListener('click', async () => {
  const startTime = Date.now()
  const img = new Image()
  img.src = (await painter.toPng()) as string
  console.log(Date.now() - startTime)
  img.onload = () => {
    document.body.append(img)
  }
})
document.body.append(button)

console.time('ready')
painter.on('ready', () => {
  console.timeEnd('ready')
  button.innerText = '生成图片'
})
