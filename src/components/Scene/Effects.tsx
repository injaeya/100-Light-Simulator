/**
 * Effects.tsx — 사진 실사급 포스트프로세싱 (물리 HDR 파이프라인)
 *
 * 컴포저는 선형 HDR 을 출력한다. 실제 카메라 파이프라인과 동일하게
 *   장면(HDR) → 노출 → (심도/블룸) → 톤매핑(ACES) → 비네팅/그레인
 * 순으로 처리해 카메라 광학 값이 물리적으로 반영되도록 한다.
 *
 *   - 노출: 조리개·셔터·ISO (H ∝ t·S/N²) 를 곱으로 반영
 *   - 피사계 심도(보케): 조리개·초점거리로 계산한 심도/블러
 *   - 블룸: 하이라이트/광원 번짐 (톤매핑 전, 노출된 선형값 기준)
 *   - SSAO: 접촉 음영으로 입체감
 *   - 톤매핑: ACES 필믹 (하이라이트 롤오프)
 *   - 비네팅 + 필름 그레인: 렌즈 주변부 감광, 센서 노이즈
 */
import {
  EffectComposer,
  N8AO,
  DepthOfField,
  Bloom,
  ToneMapping,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { depthOfField as calcDof } from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';

export function Effects() {
  const camera = useSimulatorStore((s) => s.camera);
  const dofEnabled = useSimulatorStore((s) => s.depthOfField);

  // 실제 피사계 심도(m) — 초점이 맞는 깊이 범위
  const dof = calcDof(
    camera.focalLength,
    camera.aperture,
    camera.subjectDistance,
    camera.sensor,
  );
  const focusRange = Math.min(
    12,
    Math.max(0.05, dof.total === Infinity ? 12 : dof.total),
  );

  // 보케 크기: 밝은 조리개(작은 N)·긴 초점거리일수록 크게
  const bokehScale = Math.min(
    7,
    Math.max(0.6, (7 / camera.aperture) * (camera.focalLength / 50)),
  );

  return (
    <EffectComposer multisampling={4} enableNormalPass>
      {/* 앰비언트 오클루전 — 접촉 그림자/입체감 (선형 공간) */}
      <N8AO aoRadius={0.6} distanceFalloff={1} intensity={2} quality="medium" halfRes />

      {/* 피사계 심도 — 조리개에 연동된 실제 보케 */}
      {dofEnabled && (
        <DepthOfField
          target={[0, 1.2, 0]}
          worldFocusRange={focusRange}
          bokehScale={bokehScale}
          resolutionScale={1}
        />
      )}

      {/* 블룸 — 하이라이트/광원 번짐 (노출된 선형값 기준) */}
      <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.25} intensity={0.5} />

      {/* 톤매핑 — ACES 필믹 */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      {/* 비네팅 — 렌즈 주변부 감광 */}
      <Vignette offset={0.28} darkness={0.5} blendFunction={BlendFunction.NORMAL} />

      {/* 필름 그레인 — 센서 노이즈 (미세) */}
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.18} />
    </EffectComposer>
  );
}
