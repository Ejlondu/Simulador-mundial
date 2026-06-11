/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulatorParams } from '../types';
import { Sliders, HelpCircle, Save, Settings, Info } from 'lucide-react';

interface ParamsTabProps {
  params: SimulatorParams;
  onChangeParams: (updated: SimulatorParams) => void;
  onResetToDefaults: () => void;
}

export default function ParamsTab({
  params,
  onChangeParams,
  onResetToDefaults,
}: ParamsTabProps) {
  const sumWeights =
    params.weightFifa +
    params.weightElo +
    params.weightOffense +
    params.weightDefense +
    params.weightForm;

  const handleSliderChange = (field: keyof SimulatorParams, val: number) => {
    onChangeParams({
      ...params,
      [field]: val,
    });
  };

  return (
    <div className="space-y-6" id="params-tab">
      <div className="bg-[#0E121B] rounded-xl p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Parámetros de Control de Simulación</h3>
          </div>
          <button
            onClick={onResetToDefaults}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold border border-slate-700 bg-slate-800/50 hover:bg-slate-700 px-3 py-1.5 rounded transition cursor-pointer"
          >
            Reestablecer Valores Iniciales
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General settings & modes */}
          <div className="space-y-6 font-sans">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-slate-400 mb-4">Modo de Funcionamiento</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onChangeParams({ ...params, mode: 'auto' })}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
                    params.mode === 'auto'
                      ? 'border-indigo-550 border-indigo-500 bg-indigo-950/45 ring-2 ring-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-[#121620]/60 text-slate-400'
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${params.mode === 'auto' ? 'text-indigo-400' : 'text-slate-400'}`}>
                    Pronóstico Automático
                  </span>
                  <p className="text-[11px] text-slate-500 font-light leading-snug font-sans">
                    El motor matemático calcula todos los marcadores basándose en la configuración de pesos deportivos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeParams({ ...params, mode: 'manual' })}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
                    params.mode === 'manual'
                      ? 'border-indigo-550 border-indigo-500 bg-indigo-950/45 ring-2 ring-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-[#121620]/60 text-slate-400'
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${params.mode === 'manual' ? 'text-indigo-400' : 'text-slate-400'}`}>
                    Simulación Manual
                  </span>
                  <p className="text-[11px] text-slate-500 font-light leading-snug font-sans">
                    Tú tienes el control total. Modifica los goles de cualquier partido y calcula los clasificados instantáneamente.
                  </p>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reglas Oficiales y Criterios</h4>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Desempate de Puntos en Grupos</label>
                <select
                  value={params.tieBreakCriteria}
                  onChange={(e) => onChangeParams({ ...params, tieBreakCriteria: e.target.value as any })}
                  className="w-full bg-[#121620] rounded-md border border-slate-800 p-2 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                >
                  <option value="pts_dg_gf_head">Oficial Mundial: PTS › DG › GF › Elo/FIFA</option>
                  <option value="pts_dg_gf_fair_random">Desempate Simplificado: PTS › DG › Aleatorio</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Definición en Eliminatorias</label>
                <select
                  value={params.extraTimeRules}
                  onChange={(e) => onChangeParams({ ...params, extraTimeRules: e.target.value as any })}
                  className="w-full bg-[#121620] rounded-md border border-slate-800 p-2 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                >
                  <option value="et_then_penalties">Tiempo Extra Oficial y Penaltis</option>
                  <option value="always_penalties">Penaltis Directos tras 90 min</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sliders for Predictive Motor */}
          <div className="bg-slate-900/20 rounded-2xl p-6 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-350 text-slate-300 font-sans">Ponderaciones del Predictor</h4>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${sumWeights === 100 ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-450 text-emerald-400' : 'bg-amber-950/40 border-amber-900/30 text-amber-450 text-amber-400'}`}>
                Suma: {sumWeights}%
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-normal font-light font-sans">
              Ajusta los controles deslizantes para definir cómo pondera el motor las variables de rendimiento deportivo para sugerir el resultado de cada partido.
            </p>

            <div className="space-y-4">
              {/* Sliders */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium text-slate-300">Importancia Ranking FIFA</span>
                  <span className="font-semibold text-slate-400 font-mono">{params.weightFifa}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.weightFifa}
                  onChange={(e) => handleSliderChange('weightFifa', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium text-slate-300">Importancia Rating Elo</span>
                  <span className="font-semibold text-slate-400 font-mono">{params.weightElo}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.weightElo}
                  onChange={(e) => handleSliderChange('weightElo', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium text-slate-300">Capacidad Ofensiva (GF recientes)</span>
                  <span className="font-semibold text-slate-400 font-mono">{params.weightOffense}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.weightOffense}
                  onChange={(e) => handleSliderChange('weightOffense', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium text-slate-300">Solidez Defensiva (GC recientes)</span>
                  <span className="font-semibold text-slate-400 font-mono">{params.weightDefense}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.weightDefense}
                  onChange={(e) => handleSliderChange('weightDefense', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium text-slate-300">Racha / Forma Reciente</span>
                  <span className="font-semibold text-slate-400 font-mono">{params.weightForm}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.weightForm}
                  onChange={(e) => handleSliderChange('weightForm', parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {sumWeights !== 100 && (
              <div className="flex items-start space-x-2 bg-amber-950/40 text-amber-400 p-3 rounded-lg text-[11px] border border-amber-900/30" id="weights-sum-warning">
                <Info className="w-4 h-4 mt-0.5 text-amber-550 text-amber-400 shrink-0" />
                <p className="leading-relaxed font-sans">
                  Para fines predictivos consistentes, se recomienda que la suma de todos los pesos porcentuales sea exactamente <strong>100%</strong>. Se aplicará normalización automática si difiere del total.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
