import React from 'react';
import { ChartData } from '../types';
import { ZODIAC_NAMES } from '../constants';

interface Props {
  data: ChartData;
}

const PlanetaryTable: React.FC<Props> = ({ data }) => {
  const allPoints = [data.ascendant, ...data.planets];

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/40">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs uppercase bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3">Body</th>
            <th className="px-4 py-3">Rasi (Sign)</th>
            <th className="px-4 py-3 text-right">Longitude</th>
            <th className="px-4 py-3">Nakshatra</th>
            <th className="px-4 py-3 text-center">Retro</th>
            <th className="px-4 py-3 text-center">House</th>
          </tr>
        </thead>
        <tbody>
          {allPoints.map((p, idx) => (
            <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30">
              <td className="px-4 py-3 font-medium text-amber-400">{p.name}</td>
              <td className="px-4 py-3">{ZODIAC_NAMES[p.sign]}</td>
              <td className="px-4 py-3 text-right font-mono text-slate-200">
                {Math.floor(p.degree)}° {( (p.degree % 1) * 60 ).toFixed(0)}'
              </td>
              <td className="px-4 py-3 text-slate-400">{p.nakshatra}</td>
              <td className="px-4 py-3 text-center">
                {p.isRetrograde ? <span className="text-red-400 font-bold">R</span> : '-'}
              </td>
              <td className="px-4 py-3 text-center">{p.house}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlanetaryTable;