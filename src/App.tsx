import React, { FC } from 'react'
import DraftEditor from './DraftEditor'

const App: FC = (props) => {
  return (
    <div style={{margin: '0 auto'}}>
      <h1 style={{textAlign: "center"}}>这是个TS版本的Draft.js编辑器</h1>
      <div style={{ border: '1px solid #ccc' }}>
      <DraftEditor></DraftEditor>
      </div>
    </div>
  )
}

export default App