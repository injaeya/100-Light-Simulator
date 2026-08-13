/**
 * useSim — 스토어에서 SimState 만 추출하는 공용 훅 (씬/미터 공용)
 */
import { useMemo } from 'react';
import { useSimulatorStore } from './simulatorStore';
import type { SimState } from '../sim/types';

export function useSim(): SimState {
  const cams = useSimulatorStore((s) => s.cams);
  const activeCamId = useSimulatorStore((s) => s.activeCamId);
  const expo = useSimulatorStore((s) => s.expo);
  const subj = useSimulatorStore((s) => s.subj);
  const room = useSimulatorStore((s) => s.room);
  const env = useSimulatorStore((s) => s.env);
  const wins = useSimulatorStore((s) => s.wins);
  const lights = useSimulatorStore((s) => s.lights);
  const stage = useSimulatorStore((s) => s.stage);
  return useMemo(
    () => ({ cams, activeCamId, expo, subj, room, env, wins, lights, stage }),
    [cams, activeCamId, expo, subj, room, env, wins, lights, stage],
  );
}
