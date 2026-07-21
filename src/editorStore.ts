import { create } from 'zustand'

export type WorkflowStage =
  | 'Criar'
  | 'Modelo'
  | 'Segmentar'
  | 'Corrigir'
  | 'Textura'
  | 'Pose'
  | 'Exportar'

export type ToolMode = 'select' | 'brush' | 'lasso'
export type ViewMode = 'solid' | 'wireframe'
export type ModelMode = 'demo' | 'imported'

export interface PartSettings {
  id: string
  label: string
  color: string
  visible: boolean
  roughness: number
  metalness: number
  opacity: number
  source: ModelMode
}

const demoParts: PartSettings[] = [
  { id: 'head', label: 'Cabeça', color: '#d9a982', visible: true, roughness: 0.72, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'neck', label: 'Pescoço', color: '#d5a37c', visible: true, roughness: 0.72, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'gown', label: 'Camisola hospitalar', color: '#72b8b1', visible: true, roughness: 0.9, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'left-arm', label: 'Braço esquerdo', color: '#d8a781', visible: true, roughness: 0.72, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'right-arm', label: 'Braço direito', color: '#d8a781', visible: true, roughness: 0.72, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'left-hand', label: 'Mão esquerda', color: '#d9aa84', visible: true, roughness: 0.72, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'right-hand', label: 'Mão direita', color: '#d9aa84', visible: true, roughness: 0.72, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'left-leg', label: 'Perna esquerda', color: '#cbd7df', visible: true, roughness: 0.84, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'right-leg', label: 'Perna direita', color: '#cbd7df', visible: true, roughness: 0.84, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'left-foot', label: 'Pé esquerdo', color: '#eef3f6', visible: true, roughness: 0.8, metalness: 0, opacity: 1, source: 'demo' },
  { id: 'right-foot', label: 'Pé direito', color: '#eef3f6', visible: true, roughness: 0.8, metalness: 0, opacity: 1, source: 'demo' },
]

const toPartMap = (parts: PartSettings[]) =>
  Object.fromEntries(parts.map((part) => [part.id, part])) as Record<string, PartSettings>

interface EditorState {
  stage: WorkflowStage
  tool: ToolMode
  viewMode: ViewMode
  modelMode: ModelMode
  modelUrl: string | null
  modelName: string
  selectedId: string
  parts: Record<string, PartSettings>
  resetViewNonce: number
  exportNonce: number
  setStage: (stage: WorkflowStage) => void
  setTool: (tool: ToolMode) => void
  setViewMode: (viewMode: ViewMode) => void
  selectPart: (id: string) => void
  updatePart: (id: string, patch: Partial<Omit<PartSettings, 'id' | 'source'>>) => void
  togglePart: (id: string) => void
  isolatePart: (id?: string) => void
  showAll: () => void
  setImportedModel: (url: string, name: string) => void
  registerImportedParts: (parts: PartSettings[]) => void
  restoreDemo: () => void
  resetView: () => void
  requestExport: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  stage: 'Segmentar',
  tool: 'select',
  viewMode: 'solid',
  modelMode: 'demo',
  modelUrl: null,
  modelName: 'Paciente demonstrativo',
  selectedId: 'gown',
  parts: toPartMap(demoParts),
  resetViewNonce: 0,
  exportNonce: 0,
  setStage: (stage) => set({ stage }),
  setTool: (tool) => set({ tool }),
  setViewMode: (viewMode) => set({ viewMode }),
  selectPart: (selectedId) => set({ selectedId }),
  updatePart: (id, patch) =>
    set((state) => ({
      parts: {
        ...state.parts,
        [id]: { ...state.parts[id], ...patch },
      },
    })),
  togglePart: (id) => {
    const part = get().parts[id]
    if (part) get().updatePart(id, { visible: !part.visible })
  },
  isolatePart: (id = get().selectedId) =>
    set((state) => ({
      parts: Object.fromEntries(
        Object.entries(state.parts).map(([partId, part]) => [
          partId,
          { ...part, visible: partId === id },
        ]),
      ),
    })),
  showAll: () =>
    set((state) => ({
      parts: Object.fromEntries(
        Object.entries(state.parts).map(([id, part]) => [id, { ...part, visible: true }]),
      ),
    })),
  setImportedModel: (modelUrl, modelName) =>
    set({
      modelMode: 'imported',
      modelUrl,
      modelName,
      parts: {},
      selectedId: '',
      stage: 'Modelo',
    }),
  registerImportedParts: (parts) =>
    set({
      parts: toPartMap(parts),
      selectedId: parts[0]?.id ?? '',
      stage: 'Segmentar',
    }),
  restoreDemo: () =>
    set({
      modelMode: 'demo',
      modelUrl: null,
      modelName: 'Paciente demonstrativo',
      parts: toPartMap(demoParts),
      selectedId: 'gown',
      stage: 'Segmentar',
    }),
  resetView: () => set((state) => ({ resetViewNonce: state.resetViewNonce + 1 })),
  requestExport: () => set((state) => ({ exportNonce: state.exportNonce + 1 })),
}))
