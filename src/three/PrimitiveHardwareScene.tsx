import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { AssemblyState } from '../domain/assembly';
import type { RamSlotId } from '../domain/types';
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
  lessonId?: string;
  lessonTitle: string;
  parts: PrimitivePartNode[];
  selectedPartId: string;
  onSelectPart: (partId: string) => void;
  cameraState: CameraOrbitState;
  qualityMode: QualityLevel;
  isRenderPaused: boolean;
  onFpsSample?: (fps: number) => void;
  assemblyState?: AssemblyState | null;
  postSuccess?: boolean | null;
}

function CameraRig({ cameraState }: { cameraState: CameraOrbitState }) {
  const { camera } = useThree();

  useEffect(() => {
    const { distance, azimuthAngle, polarAngle, panX, panZ } = cameraState;
    const x = panX + distance * Math.sin(polarAngle) * Math.sin(azimuthAngle);
    const y = Math.max(0.55, distance * Math.cos(polarAngle));
    const z = panZ + distance * Math.sin(polarAngle) * Math.cos(azimuthAngle);

    camera.position.set(x, y, z);
    camera.lookAt(panX, 0.25, panZ);
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

/**
 * Helper material warna sorot untuk bagian yang sedang dipilih siswa.
 */
function getHighlightProps(isSelected: boolean, baseColor: string, selectedColor = '#14996b') {
  return {
    color: isSelected ? selectedColor : baseColor,
    emissive: isSelected ? '#0b4f36' : '#000000',
    emissiveIntensity: isSelected ? 0.55 : 0,
  };
}

/**
 * 1. RAKITAN MOTHERBOARD REALISTIS (Soket CPU LGA, 4 Slot DIMM RAM, Konektor ATX 24-pin, VRM Heatsink, PCIe, I/O Shield, CMOS)
 */
function MotherboardRealisticAssembly({
  selectedPartId,
  onSelectPart,
  segments,
}: {
  selectedPartId: string;
  onSelectPart: (id: string) => void;
  segments: number;
}) {
  const isSocketSelected = selectedPartId === 'part-cpu-socket';
  const isDimmSelected =
    selectedPartId === 'part-dimm-slots' || selectedPartId === 'part-ram-module';
  const isAtx24Selected =
    selectedPartId === 'part-atx24-connector' || selectedPartId === 'part-psu-unit';

  const handleSelect = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectPart(id);
  };

  const standoffCoords: [number, number][] = [
    [-1.65, -1.2],
    [0, -1.2],
    [1.65, -1.2],
    [-1.65, 1.2],
    [0, 1.2],
    [1.65, 1.2],
  ];

  return (
    <group position={[0, 0.05, 0]}>
      {/* Papan PCB Utama ATX berlapis solder mask gelap & jalur tembaga */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.7, 0.08, 2.75]} />
        <meshStandardMaterial color="#162620" roughness={0.62} metalness={0.18} />
      </mesh>

      {/* Jalur sirkuit tembaga dekoratif di permukaan PCB */}
      {[-0.85, -0.65, -0.45, 0.45, 0.65].map((zPos, i) => (
        <mesh key={`trace-${i}`} position={[0.1, 0.043, zPos]}>
          <boxGeometry args={[2.1, 0.004, 0.018]} />
          <meshStandardMaterial color="#2a5c47" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* 6 Baut Standoff Kuningan & Cincin Solder Mounting Hole */}
      {standoffCoords.map(([sx, sz], idx) => (
        <group key={`standoff-${idx}`} position={[sx, 0, sz]}>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.01, segments]} />
            <meshStandardMaterial color="#d4a843" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.14, 6]} />
            <meshStandardMaterial color="#b5892e" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Rear I/O Shield Aluminium & Port Belakang */}
      <group position={[-1.62, 0.24, -0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.4, 1.75]} />
          <meshStandardMaterial color="#8c96a0" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Stack USB & Audio Jacks */}
        <mesh position={[0.02, 0.02, -0.55]}>
          <boxGeometry args={[0.38, 0.26, 0.32]} />
          <meshStandardMaterial color="#1f4e8c" roughness={0.4} />
        </mesh>
        <mesh position={[0.02, 0.02, 0.05]}>
          <boxGeometry args={[0.38, 0.28, 0.35]} />
          <meshStandardMaterial color="#283038" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0.02, -0.02, 0.58]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.4, segments]} />
          <meshStandardMaterial color="#178556" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>

      {/* Heatsink VRM Berfin Aluminium (Atas & Kiri Soket CPU) */}
      <group position={[-1.08, 0.22, -0.45]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.34, 1.25]} />
          <meshStandardMaterial color="#39424a" metalness={0.68} roughness={0.32} />
        </mesh>
        {[-0.45, -0.25, -0.05, 0.15, 0.35].map((fz, i) => (
          <mesh key={`vrm-fin-l-${i}`} position={[0, 0.19, fz]}>
            <boxGeometry args={[0.32, 0.06, 0.06]} />
            <meshStandardMaterial color="#68737d" metalness={0.75} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <group position={[-0.35, 0.2, -1.02]}>
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.3, 0.3]} />
          <meshStandardMaterial color="#39424a" metalness={0.68} roughness={0.32} />
        </mesh>
        {[-0.35, -0.15, 0.05, 0.25].map((fx, i) => (
          <mesh key={`vrm-fin-t-${i}`} position={[fx, 0.17, 0]}>
            <boxGeometry args={[0.07, 0.06, 0.28]} />
            <meshStandardMaterial color="#68737d" metalness={0.75} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* === BAGIAN INTERAKTIF 1: SOKET CPU (AM5 / LGA1700) === */}
      <group position={[-0.35, 0.08, -0.35]} onClick={handleSelect('part-cpu-socket')}>
        {/* Alas plastik soket */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.98, 0.07, 0.98]} />
          <meshStandardMaterial
            {...getHighlightProps(isSocketSelected, '#23292f', '#0f6b4a')}
            roughness={0.5}
          />
        </mesh>
        {/* Bingkai Logam Pengunci ILM (Independent Loading Mechanism) */}
        <mesh position={[0, 0.055, 0]} castShadow>
          <boxGeometry args={[0.88, 0.04, 0.88]} />
          <meshStandardMaterial
            {...getHighlightProps(isSocketSelected, '#9aa5b1', '#22b57e')}
            metalness={0.8}
            roughness={0.22}
          />
        </mesh>
        {/* Hamparan Pin Emas LGA di Tengah Soket + Cavity */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.64, 0.02, 0.64]} />
          <meshStandardMaterial color="#c99e32" metalness={0.75} roughness={0.35} />
        </mesh>
        {/* Kapasitor SMD di Tengah Soket */}
        <mesh position={[0, 0.095, 0]}>
          <boxGeometry args={[0.24, 0.02, 0.24]} />
          <meshStandardMaterial color="#18221d" roughness={0.5} />
        </mesh>
        {/* Tuas Pengunci Logam (Socket Load Lever Arm) */}
        <mesh position={[0.53, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.96, segments]} />
          <meshStandardMaterial color="#c2cbd4" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Tanda Segitiga Emas Penanda Orientasi di Sudut Kiri Bawah Soket */}
        <mesh position={[-0.38, 0.085, 0.38]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 3]} />
          <meshStandardMaterial color="#f7be2b" emissive="#7a5900" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* === BAGIAN INTERAKTIF 2: 4 SLOT RAM DIMM (DDR4 / DDR5) === */}
      <group
        position={[0.68, 0.1, -0.32]}
        onClick={handleSelect(
          selectedPartId === 'part-ram-module' ? 'part-ram-module' : 'part-dimm-slots',
        )}
      >
        {[-0.33, -0.11, 0.11, 0.33].map((slotX, idx) => {
          const isPrimaryChannel = idx === 1 || idx === 3; // A2 & B2
          const slotBaseColor = isPrimaryChannel ? '#2f3942' : '#1b2026';
          return (
            <group key={`dimm-${idx}`} position={[slotX, 0, 0]}>
              {/* Rel Slot DIMM */}
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.14, 1.32]} />
                <meshStandardMaterial
                  {...getHighlightProps(isDimmSelected, slotBaseColor, '#0f6b4a')}
                  roughness={0.45}
                />
              </mesh>
              {/* Celah Alur Memori & Pembatas Notch Tengah */}
              <mesh position={[0, 0.075, 0]}>
                <boxGeometry args={[0.04, 0.02, 1.22]} />
                <meshStandardMaterial color="#0d1013" />
              </mesh>
              <mesh position={[0, 0.078, -0.08]}>
                <boxGeometry args={[0.09, 0.03, 0.04]} />
                <meshStandardMaterial color="#d9e0e6" />
              </mesh>
              {/* Klip Pengunci Putih/Hijau di Kedua Ujung Slot DIMM */}
              <mesh position={[0, 0.11, -0.68]}>
                <boxGeometry args={[0.12, 0.12, 0.08]} />
                <meshStandardMaterial
                  color={isDimmSelected ? '#ffffff' : isPrimaryChannel ? '#cfd8e0' : '#6c7782'}
                />
              </mesh>
              <mesh position={[0, 0.11, 0.68]}>
                <boxGeometry args={[0.12, 0.12, 0.08]} />
                <meshStandardMaterial
                  color={isDimmSelected ? '#ffffff' : isPrimaryChannel ? '#cfd8e0' : '#6c7782'}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* === BAGIAN INTERAKTIF 3: SOKET DAYA UTAMA ATX 24-PIN === */}
      <group
        position={[1.52, 0.13, -0.25]}
        onClick={handleSelect(
          selectedPartId === 'part-psu-unit' ? 'part-psu-unit' : 'part-atx24-connector',
        )}
      >
        {/* Rumah Konektor 24-pin (2 Baris x 12 Pin) */}
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.22, 0.96]} />
          <meshStandardMaterial
            {...getHighlightProps(isAtx24Selected, '#20262b', '#0f6b4a')}
            roughness={0.4}
          />
        </mesh>
        {/* Deretan Lubang Pin Atas &Klip Pengunci Samping */}
        {[-0.38, -0.22, -0.06, 0.1, 0.26, 0.38].map((pz, idx) => (
          <mesh key={`pin24-${idx}`} position={[0, 0.115, pz]}>
            <boxGeometry args={[0.16, 0.02, 0.09]} />
            <meshStandardMaterial color="#c99e32" metalness={0.8} roughness={0.25} />
          </mesh>
        ))}
        {/* Tab Klip Pengunci Konektor 24-pin */}
        <mesh position={[0.14, 0.04, 0]}>
          <boxGeometry args={[0.05, 0.14, 0.18]} />
          <meshStandardMaterial color={isAtx24Selected ? '#ffffff' : '#8c96a0'} />
        </mesh>
      </group>

      {/* Slot Ekspansi PCIe x16 Berpelindung Baja + Baterai CMOS CR2032 + Heatsink Chipset */}
      <group position={[-0.25, 0.09, 0.58]}>
        <mesh castShadow>
          <boxGeometry args={[1.75, 0.1, 0.12]} />
          <meshStandardMaterial color="#8f9aa4" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <boxGeometry args={[1.65, 0.02, 0.05]} />
          <meshStandardMaterial color="#111518" />
        </mesh>
        <mesh position={[0.92, 0.03, 0]}>
          <boxGeometry args={[0.14, 0.1, 0.16]} />
          <meshStandardMaterial color="#0f6b4a" />
        </mesh>
      </group>

      {/* Baterai Koin CMOS CR2032 */}
      <mesh position={[-0.75, 0.07, 0.95]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, segments]} />
        <meshStandardMaterial color="#d8e0e8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Heatsink Chipset B650/B760 */}
      <mesh position={[0.75, 0.12, 0.85]} castShadow>
        <boxGeometry args={[0.85, 0.16, 0.72]} />
        <meshStandardMaterial color="#2c353d" metalness={0.72} roughness={0.28} />
      </mesh>
    </group>
  );
}

/**
 * 2. RAKITAN PROSESOR (CPU) REALISTIS (Substrat PCB, Pelat IHS Bertingkat, Pin/Pad Emas, & Segitiga Penanda Sudut)
 */
function CpuRealisticAssembly({
  selectedPartId,
  onSelectPart,
}: {
  selectedPartId: string;
  onSelectPart: (id: string) => void;
}) {
  const isIhsSelected = selectedPartId === 'part-cpu-ihs';
  const isTriangleSelected = selectedPartId === 'part-cpu-triangle';

  const handleSelect = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectPart(id);
  };

  return (
    <group position={[0, 0.18, 0]}>
      {/* Bingkai Soket Dudukan Bawah sebagai Referensi Orientasi */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[3.1, 0.12, 3.1]} />
        <meshStandardMaterial color="#1a2420" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[2.55, 0.08, 2.55]} />
        <meshStandardMaterial color="#2a3138" roughness={0.5} />
      </mesh>

      {/* Substrat PCB Hijau Prosesor dengan Lekukan Kunci Samping */}
      <mesh position={[0, 0.04, 0]} castShadow onClick={handleSelect('part-cpu-ihs')}>
        <boxGeometry args={[2.15, 0.09, 2.15]} />
        <meshStandardMaterial color="#1b5e43" roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Deretan Kontak Pad Emas di Tepi Substrat */}
      {[-0.85, -0.45, 0, 0.45, 0.85].map((offset, i) => (
        <mesh key={`pad-${i}`} position={[offset, 0.09, 0.96]}>
          <boxGeometry args={[0.14, 0.015, 0.08]} />
          <meshStandardMaterial color="#e0b138" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* === BAGIAN INTERAKTIF 1: PELAT LOGAM IHS (Integrated Heat Spreader) === */}
      <group position={[0, 0.18, 0]} onClick={handleSelect('part-cpu-ihs')}>
        {/* Lapis Dasar IHS */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.68, 0.14, 1.68]} />
          <meshStandardMaterial
            {...getHighlightProps(isIhsSelected, '#b8c2cc', '#18a370')}
            metalness={0.82}
            roughness={0.22}
          />
        </mesh>
        {/* Punggung Atas IHS (Tempat Pasta Termal Dioleskan) */}
        <mesh position={[0, 0.09, 0]} castShadow>
          <boxGeometry args={[1.38, 0.08, 1.38]} />
          <meshStandardMaterial
            {...getHighlightProps(isIhsSelected, '#d5dde6', '#25bd85')}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
        {/* Kaki Sayap IHS (Khas AM5 / LGA1700) */}
        <mesh position={[-0.9, -0.02, 0]}>
          <boxGeometry args={[0.16, 0.09, 0.65]} />
          <meshStandardMaterial color="#b8c2cc" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0.9, -0.02, 0]}>
          <boxGeometry args={[0.16, 0.09, 0.65]} />
          <meshStandardMaterial color="#b8c2cc" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* === BAGIAN INTERAKTIF 2: SEGITIGA PENANDA ORIENTASI CPU === */}
      <group position={[-0.86, 0.11, 0.86]} onClick={handleSelect('part-cpu-triangle')}>
        {/* Pelat Dasar Penanda Sudut */}
        <mesh>
          <boxGeometry args={[0.38, 0.04, 0.38]} />
          <meshStandardMaterial {...getHighlightProps(isTriangleSelected, '#203b30', '#0f6b4a')} />
        </mesh>
        {/* Segitiga Emas Presisi di Sudut Kiri Bawah CPU */}
        <mesh position={[0, 0.035, 0]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 3]} />
          <meshStandardMaterial
            color={isTriangleSelected ? '#ffe066' : '#f5b82e'}
            emissive={isTriangleSelected ? '#b37700' : '#593d00'}
            emissiveIntensity={0.75}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Segitiga Pasangan di Bingkai Soket Bawah */}
        <mesh position={[-0.25, -0.15, 0.25]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 3]} />
          <meshStandardMaterial color="#f5b82e" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 3. RAKITAN MEMORI RAM REALISTIS (Keping PCB DIMM + 8 Chip DRAM + Pin Emas + Alur Kunci Notch + Slot DIMM & Klip Pengunci)
 */
function RamRealisticAssembly({
  selectedPartId,
  onSelectPart,
}: {
  selectedPartId: string;
  onSelectPart: (id: string) => void;
}) {
  const isModuleSelected = selectedPartId === 'part-ram-module';
  const isNotchSelected = selectedPartId === 'part-ram-notch';
  const isLatchSelected = selectedPartId === 'part-ram-latch';

  const handleSelect = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectPart(id);
  };

  return (
    <group position={[0, 0.05, 0]}>
      {/* Potongan Papan Motherboard Bawah & Rel Slot DIMM */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.1, 1.8]} />
        <meshStandardMaterial color="#162620" roughness={0.65} />
      </mesh>

      {/* Rumah Slot DIMM di Bawah Keping RAM */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[3.35, 0.24, 0.34]} />
        <meshStandardMaterial color="#252c33" roughness={0.5} />
      </mesh>

      {/* === BAGIAN INTERAKTIF 1: KEPING MODUL RAM (PCB + 8 Chip DRAM + Sirip Pendingin) === */}
      <group position={[0, 0.62, 0]} onClick={handleSelect('part-ram-module')}>
        {/* Papan PCB Modul RAM */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.88, 0.1]} />
          <meshStandardMaterial
            {...getHighlightProps(isModuleSelected, '#173d2e', '#0f6b4a')}
            roughness={0.45}
            metalness={0.2}
          />
        </mesh>

        {/* 8 Chip Memori DRAM Hitam (4 Kiri, 4 Kanan) + Chip PMIC di Tengah */}
        {[-1.25, -0.9, -0.55, -0.2, 0.35, 0.7, 1.05, 1.4].map((chipX, idx) => (
          <mesh key={`dram-chip-${idx}`} position={[chipX, 0.02, 0.065]} castShadow>
            <boxGeometry args={[0.24, 0.42, 0.04]} />
            <meshStandardMaterial color="#14181d" roughness={0.35} metalness={0.3} />
          </mesh>
        ))}

        {/* Pelat Sirip Pendingin Atas (Heatspreader Top Bar) */}
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[3.2, 0.14, 0.16]} />
          <meshStandardMaterial
            color={isModuleSelected ? '#25bd85' : '#6c7782'}
            metalness={0.78}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* === BAGIAN INTERAKTIF 2: DERETAN PIN EMAS & ALUR KUNCI (NOTCH) RAM === */}
      <group position={[0, 0.14, 0]} onClick={handleSelect('part-ram-notch')}>
        {/* Baris Pin Emas Kiri sebelum Notch */}
        <mesh position={[-0.86, 0, 0]}>
          <boxGeometry args={[1.32, 0.14, 0.11]} />
          <meshStandardMaterial
            {...getHighlightProps(isNotchSelected, '#e0b138', '#ffe066')}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        {/* Baris Pin Emas Kanan sesudah Notch */}
        <mesh position={[0.76, 0, 0]}>
          <boxGeometry args={[1.52, 0.14, 0.11]} />
          <meshStandardMaterial
            {...getHighlightProps(isNotchSelected, '#e0b138', '#ffe066')}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        {/* Tonjolan Kunci (Key Bridge) pada Slot DIMM yang Masuk ke Celah Notch */}
        <mesh position={[-0.1, -0.08, 0]}>
          <boxGeometry args={[0.16, 0.26, 0.28]} />
          <meshStandardMaterial
            {...getHighlightProps(isNotchSelected, '#f5b82e', '#25bd85')}
            emissive={isNotchSelected ? '#8f6800' : '#3d2c00'}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      {/* === BAGIAN INTERAKTIF 3: KLIP PENGUNCI SAMPING SLOT DIMM (LATCHES) === */}
      <group onClick={handleSelect('part-ram-latch')}>
        {/* Pengunci Kiri */}
        <group position={[-1.74, 0.22, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.62, 0.28]} />
            <meshStandardMaterial
              {...getHighlightProps(isLatchSelected, '#d5dde6', '#22b57e')}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0.12, 0.18, 0]}>
            <boxGeometry args={[0.14, 0.12, 0.22]} />
            <meshStandardMaterial {...getHighlightProps(isLatchSelected, '#9aa5b1', '#ffffff')} />
          </mesh>
        </group>

        {/* Pengunci Kanan */}
        <group position={[1.74, 0.22, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.62, 0.28]} />
            <meshStandardMaterial
              {...getHighlightProps(isLatchSelected, '#d5dde6', '#22b57e')}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[-0.12, 0.18, 0]}>
            <boxGeometry args={[0.14, 0.12, 0.22]} />
            <meshStandardMaterial {...getHighlightProps(isLatchSelected, '#9aa5b1', '#ffffff')} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * 4. RAKITAN PENYIMPANAN REALISTIS (SSD NVMe M.2 2280 di Slot PCIe vs Port SATA & SSD 2.5 Inci)
 */
function StorageRealisticAssembly({
  selectedPartId,
  onSelectPart,
  segments,
}: {
  selectedPartId: string;
  onSelectPart: (id: string) => void;
  segments: number;
}) {
  const isNvmeSelected = selectedPartId === 'part-nvme-m2';
  const isSataSelected = selectedPartId === 'part-sata-port';

  const handleSelect = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectPart(id);
  };

  return (
    <group position={[0, 0.05, 0]}>
      {/* Papan Motherboard Dasar */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.08, 2.5]} />
        <meshStandardMaterial color="#162620" roughness={0.65} />
      </mesh>

      {/* === BAGIAN INTERAKTIF 1: SSD NVMe M.2 2280 & SLOT M.2 === */}
      <group position={[-0.85, 0.08, 0]} onClick={handleSelect('part-nvme-m2')}>
        {/* Konektor Soket M.2 Key-M di Motherboard */}
        <mesh position={[0, 0, -0.82]} castShadow>
          <boxGeometry args={[0.68, 0.16, 0.24]} />
          <meshStandardMaterial color="#20262b" roughness={0.45} />
        </mesh>
        {/* Keping PCB SSD NVMe M.2 2280 */}
        <mesh position={[0, 0.06, 0.05]} castShadow>
          <boxGeometry args={[0.62, 0.05, 1.65]} />
          <meshStandardMaterial
            {...getHighlightProps(isNvmeSelected, '#17382b', '#0f6b4a')}
            roughness={0.4}
          />
        </mesh>
        {/* Pin Emas M.2 Key-M */}
        <mesh position={[0, 0.06, -0.72]}>
          <boxGeometry args={[0.54, 0.055, 0.14]} />
          <meshStandardMaterial color="#e0b138" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Chip Controller Perak & 2 Chip NAND Flash Hitam di Atas M.2 */}
        <mesh position={[0, 0.1, -0.42]}>
          <boxGeometry args={[0.32, 0.04, 0.32]} />
          <meshStandardMaterial color="#b8c2cc" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.1, 0.05]}>
          <boxGeometry args={[0.44, 0.045, 0.42]} />
          <meshStandardMaterial color="#14181d" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.1, 0.55]}>
          <boxGeometry args={[0.44, 0.045, 0.42]} />
          <meshStandardMaterial color="#14181d" roughness={0.35} />
        </mesh>
        {/* Baut Standoff Pengunci Ujung M.2 */}
        <mesh position={[0, 0.08, 0.88]}>
          <cylinderGeometry args={[0.09, 0.09, 0.16, segments]} />
          <meshStandardMaterial color="#d8e0e8" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* === BAGIAN INTERAKTIF 2: PORT SATA MOTHERBOARD, KABEL SATA L-SHAPE, & DRIVE 2.5" === */}
      <group position={[0.95, 0.1, 0]} onClick={handleSelect('part-sata-port')}>
        {/* 2 Port Konektor SATA di Motherboard */}
        <mesh position={[-0.45, 0, -0.65]} castShadow>
          <boxGeometry args={[0.48, 0.18, 0.26]} />
          <meshStandardMaterial {...getHighlightProps(isSataSelected, '#252c33', '#0f6b4a')} />
        </mesh>
        {/* Lidah Kunci L-Shape di Dalam Port SATA */}
        <mesh position={[-0.45, 0.04, -0.65]}>
          <boxGeometry args={[0.32, 0.03, 0.28]} />
          <meshStandardMaterial color="#f5b82e" />
        </mesh>

        {/* Kabel Data SATA Menghubungkan Port ke Drive 2.5" */}
        <mesh position={[0, 0.05, -0.35]}>
          <boxGeometry args={[0.14, 0.07, 0.65]} />
          <meshStandardMaterial color={isSataSelected ? '#22b57e' : '#c93b2b'} roughness={0.4} />
        </mesh>

        {/* Unit Drive SSD/HDD SATA 2.5 Inci */}
        <mesh position={[0.15, 0.06, 0.35]} castShadow>
          <boxGeometry args={[1.25, 0.2, 1.55]} />
          <meshStandardMaterial
            {...getHighlightProps(isSataSelected, '#39424a', '#14855c')}
            metalness={0.65}
            roughness={0.32}
          />
        </mesh>
        {/* Pelat Label Atas Drive SATA */}
        <mesh position={[0.15, 0.165, 0.35]}>
          <boxGeometry args={[0.98, 0.015, 1.2]} />
          <meshStandardMaterial color="#d5dde6" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 5. RAKITAN CATU DAYA (PSU) REALISTIS (Bodi Baja ATX, Kipas 120mm + Grille, Sakelar AC, & Kabel Daya PCIe 8-pin)
 */
function PsuRealisticAssembly({
  selectedPartId,
  onSelectPart,
  segments,
}: {
  selectedPartId: string;
  onSelectPart: (id: string) => void;
  segments: number;
}) {
  const isPsuSelected = selectedPartId === 'part-psu-unit';
  const isCableSelected = selectedPartId === 'part-pcie-cable';

  const handleSelect = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectPart(id);
  };

  const fanRingRadii = useMemo(() => [0.22, 0.38, 0.54, 0.68], []);

  return (
    <group position={[0, 0.1, 0]}>
      {/* === BAGIAN INTERAKTIF 1: UNIT PSU ATX === */}
      <group position={[-0.65, 0.42, 0]} onClick={handleSelect('part-psu-unit')}>
        {/* Casing Baja PSU */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.05, 1.05, 1.85]} />
          <meshStandardMaterial
            {...getHighlightProps(isPsuSelected, '#22272c', '#0f6b4a')}
            metalness={0.55}
            roughness={0.42}
          />
        </mesh>

        {/* Pelat Stiker Spesifikasi Watt di Sisi Depan PSU */}
        <mesh position={[0, 0, 0.93]}>
          <boxGeometry args={[1.65, 0.68, 0.02]} />
          <meshStandardMaterial color="#cfd8e0" roughness={0.4} />
        </mesh>
        <mesh position={[-0.45, 0.15, 0.945]}>
          <boxGeometry args={[0.55, 0.22, 0.015]} />
          <meshStandardMaterial color="#0f6b4a" />
        </mesh>

        {/* Hub Kipas Pendingin 120mm & Cincin Grille Atas PSU */}
        <mesh position={[0, 0.535, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.03, segments]} />
          <meshStandardMaterial color="#121518" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.555, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, segments]} />
          <meshStandardMaterial color="#4a5560" metalness={0.7} roughness={0.25} />
        </mesh>
        {fanRingRadii.map((r, i) => (
          <mesh key={`grill-${i}`} position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.014, 8, segments]} />
            <meshStandardMaterial color="#9aa5b1" metalness={0.8} roughness={0.25} />
          </mesh>
        ))}

        {/* Soket Listrik AC Belakang & Sakelar Rocker I/O */}
        <mesh position={[-1.03, -0.05, 0.32]}>
          <boxGeometry args={[0.04, 0.32, 0.42]} />
          <meshStandardMaterial color="#111315" />
        </mesh>
        <mesh position={[-1.03, 0.22, -0.35]}>
          <boxGeometry args={[0.05, 0.2, 0.28]} />
          <meshStandardMaterial color="#c93b2b" />
        </mesh>
      </group>

      {/* === BAGIAN INTERAKTIF 2: KABEL & KONEKTOR DAYA GPU PCIe 8-PIN (6+2) === */}
      <group position={[1.15, 0.25, 0]} onClick={handleSelect('part-pcie-cable')}>
        {/* Bundel Kabel Sleeved Keluar dari PSU */}
        {[-0.18, -0.06, 0.06, 0.18].map((wireZ, idx) => (
          <mesh
            key={`wire-${idx}`}
            position={[-0.45, -0.05, wireZ]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.045, 0.045, 1.15, 12]} />
            <meshStandardMaterial
              color={isCableSelected ? '#25bd85' : idx % 2 === 0 ? '#1b2026' : '#d4a843'}
              roughness={0.45}
            />
          </mesh>
        ))}

        {/* Kepala Konektor Plug PCIe 8-pin (2 Baris x 4 Pin) */}
        <mesh position={[0.32, 0.02, 0]} castShadow>
          <boxGeometry args={[0.58, 0.42, 0.72]} />
          <meshStandardMaterial
            {...getHighlightProps(isCableSelected, '#262d34', '#0f6b4a')}
            roughness={0.38}
          />
        </mesh>

        {/* 8 Rumah Pin Individual (2x4) di Ujung Konektor PCIe */}
        {[-0.24, -0.08, 0.08, 0.24].map((pz, colIdx) =>
          [-0.09, 0.09].map((py, rowIdx) => (
            <mesh key={`pcie-pin-${colIdx}-${rowIdx}`} position={[0.62, py + 0.02, pz]}>
              <boxGeometry args={[0.08, 0.12, 0.12]} />
              <meshStandardMaterial color="#e0b138" metalness={0.85} roughness={0.2} />
            </mesh>
          )),
        )}

        {/* Klip Pengunci Atas Konektor PCIe 8-pin */}
        <mesh position={[0.35, 0.27, 0]}>
          <boxGeometry args={[0.42, 0.08, 0.26]} />
          <meshStandardMaterial color={isCableSelected ? '#ffffff' : '#9aa5b1'} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 6. RAKITAN INTERAKTIF LANGSUNG DARI STATE MESIN DOMAIN (FASE 4)
 * Setiap komponen yang dipasang/dilepas siswa langsung muncul atau hilang secara real-time di panggung 3D.
 */
function InteractiveBuild3DAssembly({
  assemblyState,
  postSuccess,
  segments,
}: {
  assemblyState: AssemblyState;
  postSuccess?: boolean | null;
  segments: number;
}) {
  const slotXMap: Record<RamSlotId, number> = {
    A1: 0.35,
    A2: 0.57,
    B1: 0.79,
    B2: 1.01,
  };

  const isItxBoard = assemblyState.motherboard?.formFactor === 'Mini-ITX';
  const boardWidth = isItxBoard ? 2.4 : 3.5;
  const boardDepth = isItxBoard ? 2.1 : 2.65;

  return (
    <group position={[0, 0.05, 0]}>
      {/* Baki Casing PC & Baut Standoff bila Casing Sudah Dipilih */}
      {assemblyState.pcCase && (
        <group position={[0, -0.14, 0]}>
          <mesh receiveShadow>
            <boxGeometry
              args={[
                assemblyState.pcCase.id === 'case-mini-itx' ? 2.8 : 4.5,
                0.08,
                assemblyState.pcCase.id === 'case-mini-itx' ? 2.4 : 3.3,
              ]}
            />
            <meshStandardMaterial color="#232a31" metalness={0.6} roughness={0.45} />
          </mesh>
          {/* Dinding Belakang Casing */}
          <mesh position={[assemblyState.pcCase.id === 'case-mini-itx' ? -1.35 : -2.2, 0.55, 0]}>
            <boxGeometry
              args={[0.08, 1.1, assemblyState.pcCase.id === 'case-mini-itx' ? 2.4 : 3.3]}
            />
            <meshStandardMaterial color="#2c353d" metalness={0.65} roughness={0.4} />
          </mesh>
          {/* Indikator Baut Standoff (Kuningan jika sesuai, Merah jika salah posisi/korsleting) */}
          {[-1.3, 0, 1.3].map((sx, idx) => (
            <mesh key={`case-standoff-${idx}`} position={[sx, 0.07, -0.95]}>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 6]} />
              <meshStandardMaterial
                color={assemblyState.standoffsAligned ? '#d4a843' : '#e5484d'}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Motherboard */}
      {assemblyState.motherboard && (
        <group position={[-0.2, 0, -0.1]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[boardWidth, 0.08, boardDepth]} />
            <meshStandardMaterial
              color={assemblyState.isMountedInCase ? '#163026' : '#162620'}
              roughness={0.6}
              metalness={0.18}
            />
          </mesh>

          {/* Rear I/O Shield Aluminium & Heatsink VRM Motherboard */}
          <mesh position={[-boardWidth / 2 + 0.18, 0.22, -0.35]} castShadow>
            <boxGeometry args={[0.28, 0.36, 1.35]} />
            <meshStandardMaterial color="#8c96a0" metalness={0.78} roughness={0.25} />
          </mesh>
          <mesh position={[-0.95, 0.18, -0.35]} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.98]} />
            <meshStandardMaterial color="#39424a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-0.35, 0.18, -0.92]} castShadow>
            <boxGeometry args={[0.88, 0.26, 0.24]} />
            <meshStandardMaterial color="#39424a" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Soket CPU LGA + Bingkai Logam ILM + Segitiga Sudut Emas */}
          <group position={[-0.35, 0.07, -0.35]}>
            <mesh>
              <boxGeometry args={[0.92, 0.06, 0.92]} />
              <meshStandardMaterial color="#2b333b" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.82, 0.03, 0.82]} />
              <meshStandardMaterial color="#9aa5b1" metalness={0.8} roughness={0.22} />
            </mesh>
            <mesh position={[-0.35, 0.065, 0.35]} rotation={[0, Math.PI / 4, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.02, 3]} />
              <meshStandardMaterial color="#f5b82e" />
            </mesh>
          </group>

          {/* 4 Rel Slot DIMM beserta Klip Pengunci Ujung */}
          {(['A1', 'A2', 'B1', 'B2'] as RamSlotId[]).map((slotId, sIdx) => (
            <group key={slotId} position={[slotXMap[slotId], 0.08, -0.32]}>
              <mesh>
                <boxGeometry args={[0.1, 0.1, 1.25]} />
                <meshStandardMaterial color={sIdx % 2 === 1 ? '#2f3942' : '#1b2026'} />
              </mesh>
              <mesh position={[0, 0.07, -0.64]}>
                <boxGeometry args={[0.11, 0.09, 0.06]} />
                <meshStandardMaterial color="#cfd8e0" />
              </mesh>
              <mesh position={[0, 0.07, 0.64]}>
                <boxGeometry args={[0.11, 0.09, 0.06]} />
                <meshStandardMaterial color="#cfd8e0" />
              </mesh>
            </group>
          ))}

          {/* Keping RAM yang Terpasang pada Slot Masing-Masing (Lengkap dengan Chip DRAM & Heatspreader) */}
          {(['A1', 'A2', 'B1', 'B2'] as RamSlotId[]).map((slotId) => {
            const mod = assemblyState.ramModules[slotId];
            if (!mod) return null;
            return (
              <group key={`installed-ram-${slotId}`} position={[slotXMap[slotId], 0.34, -0.32]}>
                <mesh castShadow>
                  <boxGeometry args={[0.07, 0.45, 1.22]} />
                  <meshStandardMaterial
                    color={mod.defective ? '#b42318' : '#0f6b4a'}
                    roughness={0.35}
                    metalness={0.25}
                  />
                </mesh>
                {[-0.42, -0.16, 0.16, 0.42].map((cz, cIdx) => (
                  <mesh key={`ram-ic-${cIdx}`} position={[0.042, 0, cz]}>
                    <boxGeometry args={[0.018, 0.22, 0.16]} />
                    <meshStandardMaterial color="#14181d" />
                  </mesh>
                ))}
                <mesh position={[0, 0.24, 0]}>
                  <boxGeometry args={[0.09, 0.06, 1.24]} />
                  <meshStandardMaterial color="#d5dde6" metalness={0.8} roughness={0.2} />
                </mesh>
              </group>
            );
          })}

          {/* Prosesor (CPU) Terpasang (Substrat Hijau + Pelat IHS Perak + Segitiga Emas) */}
          {assemblyState.cpu && (
            <group position={[-0.35, 0.14, -0.35]}>
              <mesh castShadow>
                <boxGeometry args={[0.76, 0.06, 0.76]} />
                <meshStandardMaterial color="#1b5e43" />
              </mesh>
              <mesh position={[0, 0.05, 0]} castShadow>
                <boxGeometry args={[0.62, 0.06, 0.62]} />
                <meshStandardMaterial color="#cfd8e0" metalness={0.85} roughness={0.2} />
              </mesh>
              <mesh position={[-0.3, 0.04, 0.3]} rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.02, 3]} />
                <meshStandardMaterial color="#f5b82e" />
              </mesh>
            </group>
          )}

          {/* Pasta Termal di Atas CPU */}
          {assemblyState.cpu && assemblyState.thermalPasteApplied && (
            <mesh position={[-0.35, 0.23, -0.35]}>
              <cylinderGeometry args={[0.14, 0.16, 0.03, segments]} />
              <meshStandardMaterial color="#8c96a0" roughness={0.3} />
            </mesh>
          )}

          {/* Pendingin CPU (Tower Heatsink Bersirip + 4 Ujung Pipa Tembaga Heatpipe + Kipas PWM) */}
          {assemblyState.cooler && (
            <group position={[-0.35, 0.56, -0.35]}>
              <mesh castShadow>
                <boxGeometry args={[0.74, 0.62, 0.68]} />
                <meshStandardMaterial color="#9aa5b1" metalness={0.8} roughness={0.22} />
              </mesh>
              {[-0.22, -0.07, 0.07, 0.22].map((hz, hIdx) => (
                <mesh key={`hp-${hIdx}`} position={[0, 0.33, hz]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.05, segments]} />
                  <meshStandardMaterial color="#c87d4b" metalness={0.85} roughness={0.2} />
                </mesh>
              ))}
              <mesh position={[0.42, 0, 0]}>
                <boxGeometry args={[0.12, 0.58, 0.64]} />
                <meshStandardMaterial color="#1f252b" />
              </mesh>
              <mesh position={[0.49, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.24, 0.24, 0.03, segments]} />
                <meshStandardMaterial color="#39424a" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          )}

          {/* Media Penyimpanan SSD NVMe M.2 (PCB + Pin Emas + Controller Perak + NAND + Standoff) */}
          {assemblyState.storage && (
            <group position={[-0.25, 0.08, 0.28]}>
              <mesh castShadow>
                <boxGeometry args={[0.88, 0.04, 0.28]} />
                <meshStandardMaterial
                  color={assemblyState.storage.hasOsInstalled ? '#0f6b4a' : '#8f4b00'}
                />
              </mesh>
              <mesh position={[-0.41, 0.005, 0]}>
                <boxGeometry args={[0.07, 0.042, 0.22]} />
                <meshStandardMaterial color="#e0b138" metalness={0.85} roughness={0.2} />
              </mesh>
              <mesh position={[-0.18, 0.03, 0]}>
                <boxGeometry args={[0.16, 0.03, 0.18]} />
                <meshStandardMaterial color="#b8c2cc" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0.14, 0.03, 0]}>
                <boxGeometry args={[0.28, 0.03, 0.22]} />
                <meshStandardMaterial color="#14181d" />
              </mesh>
              <mesh position={[0.43, 0.03, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.06, segments]} />
                <meshStandardMaterial color="#d8e0e8" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* Kartu Grafis (GPU Dual-Fan + Pipa Heatpipe Tembaga + Bracket Belakang) di Slot PCIe x16 */}
          {assemblyState.gpu && (
            <group position={[-0.15, 0.36, 0.65]}>
              <mesh castShadow>
                <boxGeometry args={[1.85, 0.52, 0.32]} />
                <meshStandardMaterial color="#262e36" metalness={0.65} roughness={0.32} />
              </mesh>
              <mesh position={[0, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5, segments]} />
                <meshStandardMaterial color="#c87d4b" metalness={0.85} roughness={0.2} />
              </mesh>
              <mesh position={[-0.94, 0.04, 0]}>
                <boxGeometry args={[0.05, 0.58, 0.36]} />
                <meshStandardMaterial color="#9aa5b1" metalness={0.8} roughness={0.25} />
              </mesh>
              <mesh position={[-0.45, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.04, segments]} />
                <meshStandardMaterial color="#14181d" />
              </mesh>
              <mesh position={[0.45, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.04, segments]} />
                <meshStandardMaterial color="#14181d" />
              </mesh>
            </group>
          )}

          {/* Indikator Kabel Daya ATX 24-pin, CPU 8-pin, PCIe 8-pin, & Monitor */}
          {assemblyState.powerCables.ATX_24PIN && (
            <mesh position={[1.45, 0.22, -0.25]}>
              <boxGeometry args={[0.22, 0.35, 0.72]} />
              <meshStandardMaterial color="#18a370" />
            </mesh>
          )}
          {assemblyState.powerCables.CPU_8PIN && (
            <mesh position={[-1.25, 0.22, -1.05]}>
              <boxGeometry args={[0.28, 0.3, 0.24]} />
              <meshStandardMaterial color="#18a370" />
            </mesh>
          )}
          {assemblyState.powerCables.PCIE_8PIN && assemblyState.gpu && (
            <mesh position={[0.65, 0.66, 0.65]}>
              <boxGeometry args={[0.24, 0.18, 0.24]} />
              <meshStandardMaterial color="#f5b82e" />
            </mesh>
          )}
          {assemblyState.monitorConnectedTo && (
            <mesh
              position={[
                -1.85,
                assemblyState.monitorConnectedTo === 'GPU' ? 0.36 : 0.18,
                assemblyState.monitorConnectedTo === 'GPU' ? 0.65 : -0.45,
              ]}
            >
              <boxGeometry args={[0.38, 0.12, 0.18]} />
              <meshStandardMaterial
                color={assemblyState.monitorConnectedTo === 'GPU' ? '#18a370' : '#d99b26'}
              />
            </mesh>
          )}

          {/* Lampu Indikator Status POST di Sudut Motherboard */}
          {postSuccess !== null && postSuccess !== undefined && (
            <mesh position={[1.45, 0.12, 0.95]}>
              <cylinderGeometry args={[0.1, 0.1, 0.08, segments]} />
              <meshStandardMaterial
                color={postSuccess ? '#1fd18a' : '#e5484d'}
                emissive={postSuccess ? '#0f6b4a' : '#b42318'}
                emissiveIntensity={0.85}
              />
            </mesh>
          )}
        </group>
      )}

      {/* Unit Catu Daya (PSU ATX + Grille Kipas Konsentris + Stiker Spesifikasi) di Sisi Kanan Bawah Casing */}
      {assemblyState.psu && (
        <group position={[1.55, 0.28, 0.95]}>
          <mesh castShadow>
            <boxGeometry args={[1.05, 0.62, 0.95]} />
            <meshStandardMaterial color="#1f2429" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.48]}>
            <boxGeometry args={[0.82, 0.36, 0.02]} />
            <meshStandardMaterial color="#cfd8e0" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.03, segments]} />
            <meshStandardMaterial color="#121518" />
          </mesh>
          {[0.14, 0.24, 0.32].map((r, rIdx) => (
            <mesh key={`psu-ring-${rIdx}`} position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.01, 6, segments]} />
              <meshStandardMaterial color="#9aa5b1" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export function PrimitiveHardwareScene({
  lessonId,
  lessonTitle,
  parts,
  selectedPartId,
  onSelectPart,
  cameraState,
  qualityMode,
  isRenderPaused,
  onFpsSample,
  assemblyState,
  postSuccess,
}: PrimitiveHardwareSceneProps) {
  const preset = getQualityPresetConfig(qualityMode);

  // Tentukan model perangkat keras 3D realistis berdasarkan ID pelajaran atau bagian aktif
  const sceneType = useMemo(() => {
    const id = (lessonId ?? '').toLowerCase();
    if (id === 'cpu' || parts.some((p) => p.id === 'part-cpu-ihs')) return 'cpu';
    if (id === 'ram' || parts.some((p) => p.id === 'part-ram-notch')) return 'ram';
    if (id === 'storage' || parts.some((p) => p.id === 'part-nvme-m2')) return 'storage';
    if (id === 'psu' || (parts.some((p) => p.id === 'part-pcie-cable') && parts.length === 2)) {
      return 'psu';
    }
    return 'motherboard';
  }, [lessonId, parts]);

  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(9, 18, 0x2a3832, 0x1c242b);
    grid.position.y = -0.22;
    return grid;
  }, []);

  return (
    <Canvas
      dpr={preset.dpr}
      shadows={preset.shadows}
      camera={{ fov: 36, near: 0.1, far: 50 }}
      gl={{ antialias: preset.antialias, powerPreference: 'default' }}
      frameloop={isRenderPaused ? 'never' : 'always'}
      aria-label={lessonTitle}
      style={{ width: '100%', height: '290px', touchAction: 'none' }}
    >
      <color attach="background" args={['#12161a']} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[4.5, 6.5, 4.5]} intensity={1.35} castShadow={preset.shadows} />
      <directionalLight position={[-4, 3, -3]} intensity={0.55} color="#b8d4e3" />

      <CameraRig cameraState={cameraState} />
      <FpsTracker isRenderPaused={isRenderPaused} onFpsSample={onFpsSample} />

      <primitive object={gridHelper} />

      {assemblyState ? (
        <InteractiveBuild3DAssembly
          assemblyState={assemblyState}
          postSuccess={postSuccess}
          segments={preset.geometrySegments}
        />
      ) : (
        <>
          {sceneType === 'motherboard' && (
            <MotherboardRealisticAssembly
              selectedPartId={selectedPartId}
              onSelectPart={onSelectPart}
              segments={preset.geometrySegments}
            />
          )}

          {sceneType === 'cpu' && (
            <CpuRealisticAssembly selectedPartId={selectedPartId} onSelectPart={onSelectPart} />
          )}

          {sceneType === 'ram' && (
            <RamRealisticAssembly selectedPartId={selectedPartId} onSelectPart={onSelectPart} />
          )}

          {sceneType === 'storage' && (
            <StorageRealisticAssembly
              selectedPartId={selectedPartId}
              onSelectPart={onSelectPart}
              segments={preset.geometrySegments}
            />
          )}

          {sceneType === 'psu' && (
            <PsuRealisticAssembly
              selectedPartId={selectedPartId}
              onSelectPart={onSelectPart}
              segments={preset.geometrySegments}
            />
          )}
        </>
      )}
    </Canvas>
  );
}
