
import React from 'react';
import { ChartData, ZodiacSign, PlanetPosition } from '../types';
import { ZODIAC_SANSKRIT } from '../constants';

interface Props {
  // We accept either the full ChartData (D-1) or a specific subset of planets + ascendant for Vargas
  data?: ChartData; 
  planets?: PlanetPosition[];
  ascendant?: PlanetPosition;
  title?: string;
  subTitle?: string;
  className?: string;
}

const SouthIndianChart: React.FC<Props> = ({ data, planets, ascendant, title = "RASI", subTitle = "D-1 Chart", className }) => {
  
  // Normalize input: use explicit props if valid, otherwise fallback to data.planets
  const activePlanets = planets || data?.planets || [];
  const activeAsc = ascendant || data?.ascendant;

  if (!activeAsc) return null;

  const getPlanetsInSign = (signId: number) => {
    const list = activePlanets.filter(p => p.sign === signId).map(p => p.name.substring(0, 2));
    if (activeAsc.sign === signId) {
        list.unshift("Asc");
    }
    return list;
  };

  const Cell = ({ signId }: { signId: number }) => {
    const pList = getPlanetsInSign(signId);
    return (
      <div className="relative border border-slate-600 bg-slate-800/30 p-1 flex flex-col justify-between h-full min-h-[80px] hover:bg-slate-800/50 transition-colors">
        <div className="flex flex-wrap content-start gap-1">
          {pList.map((p, i) => (
            <span 
                key={i} 
                className={`text-[9px] font-bold px-1 rounded-sm shadow-sm
                    ${p === 'Asc' ? 'bg-red-900/80 text-white w-full text-center mb-1' : 'bg-slate-700 text-amber-400'}
                `}
            >
              {p}
            </span>
          ))}
        </div>
        <span className="absolute bottom-0 right-1 text-[8px] text-slate-600 font-serif-header uppercase tracking-tighter opacity-70">
          {signId}. {ZODIAC_SANSKRIT[signId as ZodiacSign]}
        </span>
      </div>
    );
  };

  return (
    <div className={`aspect-square w-full border-2 border-slate-500 mx-auto select-none ${className}`}>
      <div className="grid grid-cols-4 grid-rows-4 h-full w-full">
        {/* Row 1 */}
        <Cell signId={12} />
        <Cell signId={1} />
        <Cell signId={2} />
        <Cell signId={3} />

        {/* Row 2 */}
        <Cell signId={11} />
        <div className="col-span-2 row-span-2 border border-slate-600 bg-slate-900 flex flex-col items-center justify-center p-2">
             {/* Center Content */}
            <div className="text-center opacity-80">
                <div className="text-2xl text-slate-700 font-serif-header">ॐ</div>
                <h3 className="text-amber-600 font-serif-header text-md mt-1 tracking-widest">{title}</h3>
                <p className="text-[9px] text-slate-500 uppercase">{subTitle}</p>
            </div>
        </div>
        <Cell signId={4} />

        {/* Row 3 */}
        <Cell signId={10} />
        {/* Middle merged cells */}
        <Cell signId={5} />

        {/* Row 4 */}
        <Cell signId={9} />
        <Cell signId={8} />
        <Cell signId={7} />
        <Cell signId={6} />
      </div>
    </div>
  );
};

export default SouthIndianChart;
