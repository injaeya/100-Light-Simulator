/**
 * ExposureController.tsx — 카메라 노출값을 렌더러 톤매핑 노출로 반영
 *
 * 실제 노출 방정식(H ∝ t·S / N²)에 따라 조리개·셔터·ISO 를 바꾸면
 * 동일한 장면 광량이라도 화면 밝기가 물리적으로 변한다.
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { exposureMultiplier } from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';

/**
 * 씬 휘도 스케일에 맞춘 노출 캘리브레이션 상수.
 * 기본 세팅(f/2.8·1/50·ISO400 + 9000lm 소프트박스 키)에서
 * 피사체가 적정 노출(중간톤)로 오도록 맞춘 값.
 */
const EXPOSURE_K = 1.0;

export function ExposureController() {
  const gl = useThree((s) => s.gl);
  const { aperture, shutter, iso } = useSimulatorStore((s) => s.camera);
  const exposureComp = useSimulatorStore((s) => s.exposureCompensation);

  useEffect(() => {
    const base = exposureMultiplier(aperture, shutter, iso, EXPOSURE_K);
    const exposure = base * Math.pow(2, exposureComp);
    // 과도한 값 방지 (완전 암전/과노출 극단 제한)
    gl.toneMappingExposure = Math.min(4, Math.max(0.0002, exposure));
  }, [gl, aperture, shutter, iso, exposureComp]);

  return null;
}
