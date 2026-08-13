/**
 * useExposure — 카메라 설정에서 노출 배율(선형)을 계산하는 공용 훅
 *
 * 실제 노출 방정식 H ∝ (t·S)/N² 를 기반으로, 동일 장면 광량에 대해
 * 조리개·셔터·ISO·노출보정을 반영한 스칼라 노출 배율을 돌려준다.
 * 포스트프로세싱 ON/OFF 양쪽 경로에서 동일하게 사용한다.
 */
import { exposureMultiplier } from '../../lib/optics';
import { useSimulatorStore } from '../../store/simulatorStore';

/**
 * 씬 휘도 스케일에 맞춘 노출 캘리브레이션 상수.
 * 기본 세팅(f/2.8·1/50·ISO400 + 12000lm 소프트박스 키)에서
 * 피사체가 적정 노출(중간톤)로 오도록 실측 스크린샷으로 맞춘 값.
 */
export const EXPOSURE_K = 0.15;

export function useExposure(): number {
  const { aperture, shutter, iso } = useSimulatorStore((s) => s.camera);
  const exposureComp = useSimulatorStore((s) => s.exposureCompensation);
  const base = exposureMultiplier(aperture, shutter, iso, EXPOSURE_K);
  const exposure = base * Math.pow(2, exposureComp);
  return Math.min(4, Math.max(0.0002, exposure));
}
