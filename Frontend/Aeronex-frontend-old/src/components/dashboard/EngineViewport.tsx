import { RotateCcw, Rotate3D } from 'lucide-react'
import { useState } from 'react'
import { EngineCanvas } from '../3d/EngineCanvas'
import { ComponentInspector } from '../3d/ComponentInspector'
import type { ComponentName } from '../3d/AeroPistonEngineModel'
export function EngineViewport({large=false}:{large?:boolean}) { const [auto,setAuto]=useState(false);const [selected,setSelected]=useState<ComponentName|null>(null);const [reset,setReset]=useState(0);return <section className={'panel engine-viewport '+(large?'large':'')}><div className="section-head"><div><p>ENGINE DIGITAL TWIN</p><h2>REPRESENTATIVE AERO PISTON ENGINE</h2></div><span className="academic">ACADEMIC VISUALIZATION</span></div><div className="canvas-layout"><EngineCanvas autoRotate={auto} onSelect={setSelected} resetSignal={reset}/><ComponentInspector component={selected}/></div><div className="twin-actions"><button onClick={()=>{setAuto(false);setReset(v=>v+1)}}><RotateCcw size={14}/> RESET VIEW</button><button className={auto?'selected':''} onClick={()=>setAuto(!auto)}><Rotate3D size={14}/> AUTO ROTATE</button></div></section> }
