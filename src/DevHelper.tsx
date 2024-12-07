import { LayoutItem } from './LinkArrange.tsx'

export default function DevHelper({ data }: { data: LayoutItem[] }) {
  return (
    <div className='flex items-center gap-4 border-solid border-1 border-dark p-1' style={{ width: 300, height: 100 }}>
      {data.map((item, index) => {
        if (typeof item === 'string') {
          return (
            <div key={item} className='p-2 border-solid border-1 border-cyan'>
              {item}
            </div>
          )
        }

        return (
          <div key={index} className='flex flex-col gap-2 items-center p-2 border-solid border-1 border-cyan'>
            {item.map((row, rIndex) => {
              if (typeof row === 'string') {
                return (
                  <div key={row} className=''>
                    {row}
                  </div>
                )
              }
              return (
                <div key={rIndex} className='flex gap-4'>
                  {row.map(rowItem => (
                    <div key={rowItem}>{rowItem}</div>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
