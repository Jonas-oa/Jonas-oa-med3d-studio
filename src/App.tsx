import { Component, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ErrorInfo, ReactNode } from 'react'
import {
  Box,
  Brush,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  Eye,
  EyeOff,
  Focus,
  Grid3X3,
  Layers3,
  Menu,
  MousePointer2,
  PanelLeft,
  PanelRight,
  Redo2,
  RotateCcw,
  ScanLine,
  Scissors,
  Search,
  Sparkles,
  SquareDashedMousePointer,
  Undo2,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react'
import EditorScene from './Scene'
import {
  PartSettings,
  ToolMode,
  useEditorStore,
  ViewMode,
  WorkflowStage,
} from './editorStore'

type SceneStatus = 'loading' | 'ready' | 'error'

function WebGLFallback() {
  return (
    <div className="webgl-fallback" role="alert">
      <div className="fallback-figure" aria-hidden="true">
        <span className="fallback-head" />
        <span className="fallback-body" />
        <span className="fallback-arm left" />
        <span className="fallback-arm right" />
        <span className="fallback-leg left" />
        <span className="fallback-leg right" />
      </div>
      <div className="fallback-copy">
        <strong>O visualizador 3D foi bloqueado</strong>
        <span>Abra esta página diretamente no Chrome para habilitar o WebGL. Os painéis do editor continuam disponíveis.</span>
        <button type="button" className="secondary-button" onClick={() => window.location.reload()}>
          <RotateCcw size={17} /> Tentar novamente
        </button>
      </div>
    </div>
  )
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha ao iniciar o visualizador 3D:', error, info)
    this.props.onError()
  }

  render() {
    return this.state.hasError ? <WebGLFallback /> : this.props.children
  }
}

const stages: Array<{ label: WorkflowStage; icon: typeof Sparkles }> = [
  { label: 'Criar', icon: Sparkles },
  { label: 'Modelo', icon: Box },
  { label: 'Segmentar', icon: Scissors },
  { label: 'Corrigir', icon: WandSparkles },
  { label: 'Textura', icon: Brush },
  { label: 'Pose', icon: UserRound },
  { label: 'Exportar', icon: Download },
]

const tools: Array<{ id: ToolMode; label: string; icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Selecionar', icon: MousePointer2 },
  { id: 'brush', label: 'Pincel', icon: Brush },
  { id: 'lasso', label: 'Laço', icon: SquareDashedMousePointer },
]

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><ScanLine size={21} /></div>
      <div>
        <strong>Med3D</strong>
        <span>STUDIO</span>
      </div>
    </div>
  )
}

function TopBar({ onImport }: { onImport: () => void }) {
  const modelName = useEditorStore((state) => state.modelName)
  const modelMode = useEditorStore((state) => state.modelMode)
  const requestExport = useEditorStore((state) => state.requestExport)
  const restoreDemo = useEditorStore((state) => state.restoreDemo)

  return (
    <header className="topbar">
      <Brand />
      <div className="project-name" title={modelName}>
        <CircleDot size={15} />
        <span>{modelName}</span>
        <em>{modelMode === 'demo' ? 'Demonstração' : 'Arquivo local'}</em>
      </div>
      <div className="history-actions" aria-label="Histórico">
        <button type="button" className="icon-button" disabled title="Desfazer — disponível na próxima etapa"><Undo2 size={18} /></button>
        <button type="button" className="icon-button" disabled title="Refazer — disponível na próxima etapa"><Redo2 size={18} /></button>
      </div>
      <div className="top-actions">
        {modelMode === 'imported' && (
          <button type="button" className="ghost-button desktop-only" onClick={restoreDemo}>
            <RotateCcw size={17} /> Paciente demo
          </button>
        )}
        <button type="button" className="ghost-button" onClick={onImport}>
          <Upload size={17} /> <span className="button-label">Importar GLB</span>
        </button>
        <button type="button" className="primary-button" onClick={requestExport}>
          <Download size={17} /> <span className="button-label">Exportar GLB</span>
        </button>
      </div>
    </header>
  )
}

function StageBar() {
  const stage = useEditorStore((state) => state.stage)
  const setStage = useEditorStore((state) => state.setStage)

  return (
    <nav className="stagebar" aria-label="Etapas do projeto">
      <div className="stage-track">
        {stages.map(({ label, icon: Icon }, index) => (
          <div className="stage-item-wrap" key={label}>
            <button
              type="button"
              className={`stage-item ${stage === label ? 'active' : ''}`}
              onClick={() => setStage(label)}
            >
              <span className="stage-number">{index + 1}</span>
              <Icon size={16} />
              {label}
            </button>
            {index < stages.length - 1 && <ChevronRight size={14} className="stage-chevron" />}
          </div>
        ))}
      </div>
    </nav>
  )
}

function PartsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const parts = useEditorStore((state) => state.parts)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectPart = useEditorStore((state) => state.selectPart)
  const togglePart = useEditorStore((state) => state.togglePart)
  const modelMode = useEditorStore((state) => state.modelMode)
  const [query, setQuery] = useState('')

  const filteredParts = useMemo(
    () => Object.values(parts).filter((part) => part.label.toLowerCase().includes(query.toLowerCase())),
    [parts, query],
  )

  return (
    <aside className={`side-panel left-panel ${open ? 'mobile-open' : ''}`}>
      <div className="panel-heading">
        <div><Layers3 size={18} /><strong>Partes do modelo</strong></div>
        <button type="button" className="icon-button mobile-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="search-box">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar parte…" />
      </div>
      <div className="parts-summary">
        <span>{filteredParts.length} partes</span>
        <span className="status-dot">{modelMode === 'demo' ? 'Segmentação exemplo' : 'Malhas detectadas'}</span>
      </div>
      <div className="parts-list">
        {filteredParts.length === 0 ? (
          <div className="empty-state">
            <Layers3 size={30} />
            <strong>Nenhuma parte encontrada</strong>
            <span>Importe um GLB ou limpe a busca.</span>
          </div>
        ) : filteredParts.map((part, index) => (
          <button
            type="button"
            key={part.id}
            className={`part-row ${selectedId === part.id ? 'selected' : ''}`}
            onClick={() => selectPart(part.id)}
          >
            <span className="part-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="part-swatch" style={{ backgroundColor: part.color }} />
            <span className="part-name">{part.label}</span>
            <span
              role="button"
              tabIndex={0}
              className="visibility-toggle"
              title={part.visible ? 'Ocultar' : 'Mostrar'}
              onClick={(event) => {
                event.stopPropagation()
                togglePart(part.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  togglePart(part.id)
                }
              }}
            >
              {part.visible ? <Eye size={17} /> : <EyeOff size={17} />}
            </span>
          </button>
        ))}
      </div>
      <div className="panel-tip">
        <MousePointer2 size={17} />
        <span>Clique diretamente no modelo para selecionar uma parte.</span>
      </div>
    </aside>
  )
}

function RangeField({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label className="range-field">
      <span><strong>{label}</strong><output>{Math.round(value * 100)}%</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function PropertiesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const selectedId = useEditorStore((state) => state.selectedId)
  const part = useEditorStore((state) => state.parts[selectedId])
  const updatePart = useEditorStore((state) => state.updatePart)
  const isolatePart = useEditorStore((state) => state.isolatePart)
  const togglePart = useEditorStore((state) => state.togglePart)

  return (
    <aside className={`side-panel right-panel ${open ? 'mobile-open' : ''}`}>
      <div className="panel-heading">
        <div><Grid3X3 size={18} /><strong>Propriedades</strong></div>
        <button type="button" className="icon-button mobile-close" onClick={onClose}><X size={18} /></button>
      </div>
      {!part ? (
        <div className="empty-state properties-empty">
          <MousePointer2 size={34} />
          <strong>Selecione uma parte</strong>
          <span>As propriedades aparecerão aqui.</span>
        </div>
      ) : (
        <div className="properties-content">
          <div className="selected-preview">
            <span className="large-swatch" style={{ backgroundColor: part.color }} />
            <div>
              <small>Parte selecionada</small>
              <strong>{part.label}</strong>
              <span>{part.source === 'demo' ? 'Paciente demonstrativo' : 'Malha importada'}</span>
            </div>
          </div>

          <label className="field-label">
            Nome da parte
            <input value={part.label} onChange={(event) => updatePart(part.id, { label: event.target.value })} />
          </label>

          <div className="color-field">
            <label htmlFor="part-color">Cor do material</label>
            <div>
              <input id="part-color" type="color" value={part.color} onChange={(event) => updatePart(part.id, { color: event.target.value })} />
              <input value={part.color.toUpperCase()} onChange={(event) => /^#[0-9a-f]{6}$/i.test(event.target.value) && updatePart(part.id, { color: event.target.value })} />
            </div>
          </div>

          <section className="property-section">
            <div className="section-title"><strong>Material PBR</strong><span>Prévia em tempo real</span></div>
            <RangeField label="Rugosidade" value={part.roughness} onChange={(value) => updatePart(part.id, { roughness: value })} />
            <RangeField label="Metalicidade" value={part.metalness} onChange={(value) => updatePart(part.id, { metalness: value })} />
            <RangeField label="Opacidade" value={part.opacity} onChange={(value) => updatePart(part.id, { opacity: value })} />
          </section>

          <section className="property-section compact-actions">
            <button type="button" className="secondary-button" onClick={() => isolatePart(part.id)}><Focus size={17} /> Isolar</button>
            <button type="button" className="secondary-button" onClick={() => togglePart(part.id)}>
              {part.visible ? <EyeOff size={17} /> : <Eye size={17} />} {part.visible ? 'Ocultar' : 'Mostrar'}
            </button>
          </section>

          <div className="model-stats">
            <div><span>Seleção</span><strong>1 parte</strong></div>
            <div><span>Material</span><strong>PBR</strong></div>
            <div><span>Estado</span><strong>{part.visible ? 'Visível' : 'Oculta'}</strong></div>
          </div>
        </div>
      )}
    </aside>
  )
}

function BottomToolbar() {
  const tool = useEditorStore((state) => state.tool)
  const setTool = useEditorStore((state) => state.setTool)
  const viewMode = useEditorStore((state) => state.viewMode)
  const setViewMode = useEditorStore((state) => state.setViewMode)
  const isolatePart = useEditorStore((state) => state.isolatePart)
  const showAll = useEditorStore((state) => state.showAll)
  const resetView = useEditorStore((state) => state.resetView)
  const selectedId = useEditorStore((state) => state.selectedId)

  return (
    <div className="bottom-toolbar" aria-label="Ferramentas do editor">
      <div className="toolbar-group tools-group">
        {tools.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} className={tool === id ? 'active' : ''} onClick={() => setTool(id)} title={label}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </div>
      <div className="toolbar-divider" />
      <div className="toolbar-group view-group">
        <button type="button" onClick={() => isolatePart()} disabled={!selectedId} title="Isolar parte"><Focus size={18} /><span>Isolar</span></button>
        <button type="button" onClick={showAll} title="Mostrar todas"><Eye size={18} /><span>Mostrar tudo</span></button>
        <button type="button" className={viewMode === 'wireframe' ? 'active' : ''} onClick={() => setViewMode(viewMode === 'solid' ? 'wireframe' : 'solid')} title="Alternar wireframe"><Grid3X3 size={18} /><span>Wireframe</span></button>
        <button type="button" onClick={resetView} title="Centralizar câmera"><RotateCcw size={18} /><span>Centralizar</span></button>
      </div>
    </div>
  )
}

function StageNotice() {
  const stage = useEditorStore((state) => state.stage)
  const notices: Partial<Record<WorkflowStage, string>> = {
    Criar: 'Geração por imagem e texto será conectada ao serviço de IA na etapa 2.',
    Corrigir: 'Pincel de reconstrução e fechamento de malha entram na próxima entrega.',
    Textura: 'A edição básica de material já funciona no painel de propriedades.',
    Pose: 'Rigging e biblioteca de posicionamentos radiológicos estão planejados.',
    Exportar: 'Use “Exportar GLB” no topo para baixar o modelo visível.',
  }
  const text = notices[stage]
  if (!text) return null
  return <div className="stage-notice"><Sparkles size={15} /><span>{text}</span></div>
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousUrlRef = useRef<string | null>(null)
  const setImportedModel = useEditorStore((state) => state.setImportedModel)
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>('loading')

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.glb')) {
      window.alert('Nesta primeira versão, importe um arquivo GLB completo.')
      event.target.value = ''
      return
    }
    if (previousUrlRef.current) URL.revokeObjectURL(previousUrlRef.current)
    const url = URL.createObjectURL(file)
    previousUrlRef.current = url
    setImportedModel(url, file.name.replace(/\.glb$/i, ''))
    event.target.value = ''
  }

  return (
    <main className="app-shell">
      <input ref={fileInputRef} type="file" accept=".glb,model/gltf-binary" hidden onChange={handleFile} />
      <TopBar onImport={() => fileInputRef.current?.click()} />
      <StageBar />

      <section className="workspace">
        <PartsPanel open={leftOpen} onClose={() => setLeftOpen(false)} />
        <div className="viewport-shell">
          <SceneErrorBoundary onError={() => setSceneStatus('error')}>
            <EditorScene
              onReady={() => setSceneStatus('ready')}
              onContextLost={() => setSceneStatus('error')}
            />
          </SceneErrorBoundary>
          {sceneStatus === 'error' && <WebGLFallback />}
          <div className={`viewport-badge ${sceneStatus}`}>
            <span className="live-dot" />
            {sceneStatus === 'ready' ? 'WebGL ativo' : sceneStatus === 'error' ? 'Modo de compatibilidade' : 'Iniciando 3D…'}
          </div>
          <div className="mobile-panel-buttons">
            <button type="button" onClick={() => setLeftOpen(true)}><PanelLeft size={19} /><span>Partes</span></button>
            <button type="button" onClick={() => setRightOpen(true)}><PanelRight size={19} /><span>Propriedades</span></button>
          </div>
          <StageNotice />
        </div>
        <PropertiesPanel open={rightOpen} onClose={() => setRightOpen(false)} />
        {(leftOpen || rightOpen) && <button type="button" className="mobile-backdrop" aria-label="Fechar painel" onClick={() => { setLeftOpen(false); setRightOpen(false) }} />}
      </section>
      <BottomToolbar />
    </main>
  )
}
