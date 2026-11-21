import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  getQualityPresetConfig,
  type CameraOrbitState,
  type QualityLevel,
} from './stageController';

export interface PrimitivePartNode {
  id: string;
  label: string;
}

interface PrimitiveHardwareSceneProps {
  lessonTitle: string;
  parts: PrimitivePartNode[];
  selectedPartId: string;
  onSelectPart: (partId: string) => void;
  cameraState: CameraOrbitState;
  qualityMode: QualityLevel;
  isRenderPaused: boolean;
  onFpsSample?: (fps: number) => void;
}

function CameraRig({ cameraState }: { cameraState: CameraOrbitState }) {
  const { camera } = useThree();

  useEffect(() => {
    const { distance, azimuthAngle, polarAngle, panX, panZ } = cameraState;
    const x = panX + distance * Math.sin(polarAngle) * Math.sin(azimuthAngle);
    const y = Math.max(0.45, distance * Math.cos(polarAngle));
    const z = panZ + distance * Math.sin(polarAngle) * Math.cos(azimuthAngle);

    camera.position.set(x, y, z);
    camera.lookAt(panX, 0.2, panZ);
    camera.updateProjectionMatrix();
  }, [camera, cameraState]);

  return null;
}

function FpsTracker({
  isRenderPaused,
  onFpsSample,
}: {
  isRenderPaused: boolean;
  onFpsSample?: (fps: number) => void;
}) {
  const frameCount = useRef(0);
  const elapsed = useRef(0);

  useFrame((_state, delta) => {
    if (isRenderPaused || !onFpsSample) return;
    frameCount.current += 1;
    elapsed.current += delta;

    if (elapsed.current >= 1.5) {
      const currentFps = Math.round(frameCount.current / elapsed.current);
      onFpsSample(currentFps);
      frameCount.current = 0;
      elapsed.current = 0;
    }
  });

  return null;
}

function PartPrimitiveMesh({
  part,
  index,
  total,
  isSelected,
  segments,
  onSelect,
}: {
  part: PrimitivePartNode;
  index: number;
  total: number;
  isSelected: boolean;
  segments: number;
  onSelect: () => void;
}) {
  const spacing = 1.35;
  const startX = -((total - 1) * spacing) / 2;
  const posX = startX + index * spacing;

  const isCylinder =
    part.id.includes('psu') ||
    part.id.includes('cable') ||
    part.id.includes('latch') ||
    part.id.includes('triangle');

  const fillColor = isSelected ? '#0f6b4a' : '#4a5560';
  const accentCapColor = isSelected ? '#e6f4ee' : '#c8d0d8';

  return (
    <group position={[posX, 0.32, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        {isCylinder ? (
          <cylinderGeometry args={[0.38, 0.38, 0.52, segments]} />
        ) : (
          <boxGeometry args={[0.92, 0.44, 0.68]} />
        )}
        <meshStandardMaterial color={fillColor} roughness={0.45} metalness={0.25} />
      </mesh>

      {/* Penanda detail primitif di atas komponen (pin/heatsink/notch) */}
      <mesh
        position={[0, 0.28, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[0.45, 0.1, 0.25]} />
        <meshStandardMaterial color={accentCapColor} roughness={0.35} />
      </mesh>
    </group>
  );
}

export function PrimitiveHardwareScene({
  lessonTitle,
  parts,
  selectedPartId,
  onSelectPart,
  cameraState,
  qualityMode,
  isRenderPaused,
  onFpsSample,
}: PrimitiveHardwareSceneProps) {
  const preset = getQualityPresetConfig(qualityMode);

  return (
    <Canvas
      dpr={preset.dpr}
      shadows={preset.shadows}
      gl={{ antialias: preset.antialias, powerPreference: 'default' }}
      frameloop={isRenderPaused ? 'never' : 'always'}
      aria-label={lessonTitle}
      style={{ width: '100%', height: '240px', touchAction: 'none' }}
    >
      <color attach="background" args={['#121518']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 4]} intensity={1.15} castShadow={preset.shadows} />

      <CameraRig cameraState={cameraState} />
      <FpsTracker isRenderPaused={isRenderPaused} onFpsSample={onFpsSample} />

      {/* Papan sirkuit dasar (PCB Base) dengan geometri primitif kotak */}
      <mesh position={[0, 0, 0]} receiveShadow={preset.shadows}>
        <boxGeometry args={[4.4, 0.12, 2.5]} />
        <meshStandardMaterial color="#1d2c26" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Garis tepi pelat sasis */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[4.6, 0.05, 2.7]} />
        <meshStandardMaterial color="#2c353d" roughness={0.6} />
      </mesh>

      {/* Komponen-komponen primitif yang bisa diklik */}
      {parts.map((part, index) => (
        <PartPrimitiveMesh
          key={part.id}
          part={part}
          index={index}
          total={parts.length}
          isSelected={part.id === selectedPartId}
          segments={preset.geometrySegments}
          onSelect={() => onSelectPart(part.id)}
        />
      ))}
    </Canvas>
  );
}
