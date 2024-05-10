import { useState } from 'react'
import LinkArrange from './LinkArrange'
// import { mock } from './mock.tsx'
import './PureChain/chain'

function App () {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
        </button>
        {/* <LinkArrange width={800} height={600} /> */}
      </div>
    </div>
  )
}

export default App

