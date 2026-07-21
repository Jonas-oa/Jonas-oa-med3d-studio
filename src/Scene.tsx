import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber'
import {
  Bounds,
  Center,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { PartSettings, useEditorStore } from './editorStore'

interface PartMeshProps {
  partId: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  children: React.ReactNode
}

function PartMesh({ partId, position, rotation, scale, children }: PartMeshProps) {
  const part = useEditorStore((state) => state.parts[partId])
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectPart = useEditorStore((state) => state.selectPart)
  const viewMode = useEditorStore((state) => state.viewMode)
  const [hovered, setHovered] = useState(false)

  if (!part) return null

  return (
    <mesh
      name={partId}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={part.visible}
      castShadow
      receiveShadow
      onPointerDown={(event) => {
        event.stopPropagation()
        selectPart(partId)
      }}
      onPointerEnter={(event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      {children}
      <meshStandardMaterial
        color={part.color}
        roughness={part.roughness}
        metalness={part.metalness}
        opacity={part.opacity}
        transparent={part.opacity < 1}
        wireframe={viewMode === 'wireframe'}
        emissive={selectedId === partId || hovered ? '#0b4054' : '#000000'}
        emissiveIntensity={selectedId === partId ? 0.55 : hovered ? 0.25 : 0}
      />
    </mesh>
  )
}

function DemoPatient() {
  return (
    <group name="MED3D_MODEL_ROOT" position={[0, -0.15, 0]}>
      <PartMesh partId="head" position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.5, 48, 32]} />
      </PartMesh>
      <PartMesh partId="neck" position={[0, 1.93, 0]}>
        <cylinderGeometry args={[0.22, 0.27, 0.42, 32]} />
      </PartMesh>
      <PartMesh partId="gown" position={[0, 0.77, 0]}>
        <cylinderGeometry args={[0.68, 0.98, 1.9, 48, 4, false]} />
      </PartMesh>
      <PartMesh partId="left-arm" position={[-0.91, 0.93, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.17, 1.28, 8, 24]} />
      </PartMesh>
      <PartMesh partId="right-arm" position={[0.91, 0.93, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.17, 1.28, 8, 24]} />
      </PartMesh>
      <PartMesh partId="left-hand" position={[-0.99, -0.02, 0]} scale={[0.82, 1.15, 0.62]}>
        <sphereGeometry args={[0.22, 32, 24]} />
      </PartMesh>
      <PartMesh partId="right-hand" position={[0.99, -0.02, 0]} scale={[0.82, 1.15, 0.62]}>
        <sphereGeometry args={[0.22, 32, 24]} />
      </PartMesh>
      <PartMesh partId="left-leg" position={[-0.35, -1.16, 0]}>
        <capsuleGeometry args={[0.23, 1.48, 8, 24]} />
      </PartMesh>
      <PartMesh partId="right-leg" position={[0.35, -1.16, 0]}>
        <capsuleGeometry args={[0.23, 1.48, 8, 24]} />
      </PartMesh>
      <PartMesh partId="left-foot" position={[-0.35, -2.18, 0.16]} scale={[0.72, 0.38, 1.35]}>
        <sphereGeometry args={[0.34, 32, 24]} />
      </PartMesh>
      <PartMesh partId="right-foot" position={[0.35, -2.18, 0.16]} scale={[0.72, 0.38, 1.35]}>
        <sphereGeometry args={[0.34, 32, 24]} />
      </PartMesh>
    </group>
  )
}

function ImportedModel({ url }: { url: string }) {
  const gltf = useGLTF(url)
  const model = useMemo(() => cloneSkeleton(gltf.scene), [gltf.scene])
  const parts = useEditorStore((state) => state.parts)
  const selectedId = useEditorStore((state) => state.selectedId)
  const selectPart = useEditorStore((state) => state.selectPart)
  const registerImportedParts = useEditorStore((state) => state.registerImportedParts)
  const viewMode = useEditorStore((state) => state.viewMode)

  useEffect(() => {
    const importedParts: PartSettings[] = []
    let index = 0

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone()
      const id = `imported-${object.uuid}`
      object.userData.partId = id
      const firstMaterial = Array.isArray(object.material) ? object.material[0] : object.material
      const standard = firstMaterial instanceof THREE.MeshStandardMaterial ? firstMaterial : null
      importedParts.push({
        id,
        label: object.name || `Parte ${++index}`,
        color: standard ? `#${standard.color.getHexString()}` : '#9eb7c7',
        visible: object.visible,
        roughness: standard?.roughness ?? 0.72,
        metalness: standard?.metalness ?? 0,
        opacity: standard?.opacity ?? 1,
        source: 'imported',
      })
      object.castShadow = true
      object.receiveShadow = true
    })

    registerImportedParts(importedParts)
  }, [model, registerImportedParts])

  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const id = object.userData.partId as string | undefined
      if (!id) return
      const part = parts[id]
      if (!part) return
      object.visible = part.visible
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return
        material.color.set(part.color)
        material.roughness = part.roughness
        material.metalness = part.metalness
        material.opacity = part.opacity
        material.transparent = part.opacity < 1
        material.wireframe = viewMode === 'wireframe'
        material.emissive.set(id === selectedId ? '#0b4054' : '#000000')
        material.emissiveIntensity = id === selectedId ? 0.5 : 0
        material.needsUpdate = true
      })
    })
  }, [model, parts, selectedId, viewMode])

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const id = event.object.userData.partId as string | undefined
    if (id) selectPart(id)
  }

  return <primitive name="MED3D_MODEL_ROOT" object={model} onPointerDown={handlePointerDown} />
}

function CameraReset() {
  const resetViewNonce = useEditorStore((state) => state.resetViewNonce)
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as THREE.EventDispatcher & {
    target?: THREE.Vector3
    update?: () => void
  } | null
  const previousNonce = useRef(resetViewNonce)

  useEffect(() => {
    if (previousNonce.current === resetViewNonce) return
    previousNonce.current = resetViewNonce
    camera.position.set(4.8, 2.6, 6.8)
    if (controls?.target) controls.target.set(0, 0.25, 0)
    controls?.update?.()
  }, [camera, controls, resetViewNonce])

  return null
}

function SceneExporter() {
  const exportNonce = useEditorStore((state) => state.exportNonce)
  const modelName = useEditorStore((state) => state.modelName)
  const scene = useThree((state) => state.scene)
  const lastExport = useRef(exportNonce)

  useEffect(() => {
    if (lastExport.current === exportNonce) return
    lastExport.current = exportNonce
    const root = scene.getObjectByName('MED3D_MODEL_ROOT')
    if (!root) return

    const exporter = new GLTFExporter()
    exporter.parse(
      root,
      (result) => {
        const blob = result instanceof ArrayBuffer
          ? new Blob([result], { type: 'model/gltf-binary' })
          : new Blob([JSON.stringify(result)], { type: 'model/gltf+json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${modelName.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'med3d-modelo'}.glb`
        anchor.click()
        URL.revokeObjectURL(url)
      },
      (error) => console.error('Falha ao exportar GLB:', error),
      { binary: true, onlyVisible: true },
    )
  }, [exportNonce, modelName, scene])

  return null
}

function LoadingModel() {
  return (
    <Html center>
      <div className="canvas-loader">
        <span className="spinner" />
        Preparando modelo…
      </div>
    </Html>
  )
}

export default function EditorScene() {
  const modelMode = useEditorStore((state) => state.modelMode)
  const modelUrl = useEditorStore((state) => state.modelUrl)
  const selectPart = useEditorStore((state) => state.selectPart)

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [4.8, 2.6, 6.8], fov: 38, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onPointerMissed={() => selectPart('')}
    >
      <color attach="background" args={['#07121d']} />
      <fog attach="fog" args={['#07121d', 10, 24]} />
      <hemisphereLight intensity={1.3} color="#e9fbff" groundColor="#14202a" />
      <directionalLight
        castShadow
        position={[4, 7, 5]}
        intensity={3.2}
        color="#e7f8ff"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 2, -3]} intensity={1.6} color="#58b6cf" />
      <spotLight position={[0, 6, -4]} intensity={1.5} angle={0.7} penumbra={1} color="#ffffff" />

      <Suspense fallback={<LoadingModel />}>
        <Bounds fit clip observe margin={1.22}>
          <Center>
            {modelMode === 'demo' ? <DemoPatient /> : modelUrl ? <ImportedModel url={modelUrl} /> : null}
          </Center>
        </Bounds>
      </Suspense>

      <Grid
        position={[0, -2.62, 0]}
        args={[16, 16]}
        cellSize={0.25}
        cellThickness={0.6}
        cellColor="#1b4658"
        sectionSize={1}
        sectionThickness={1.2}
        sectionColor="#31718a"
        fadeDistance={14}
        fadeStrength={1}
        infiniteGrid
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2.5} maxDistance={16} />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport axisColors={['#ef6b73', '#79d68f', '#6daaf3']} labelColor="#eef8fc" />
      </GizmoHelper>
      <CameraReset />
      <SceneExporter />
    </Canvas>
  )
}
