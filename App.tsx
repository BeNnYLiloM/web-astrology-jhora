
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SouthIndianChart from './components/SouthIndianChart';
import PlanetaryTable from './components/PlanetaryTable';
import { BirthDetails, ChartData, AiAnalysisResult, AyanamsaType, CalculationSettings, MakarandaMode } from './types';
import { calculateChart, getApiUrl, setApiUrl } from './services/calcService';
import { generateAstrologyReport } from './services/geminiService';
import { Menu, Star, MapPin, Calendar, Clock, Sparkles, RefreshCw, Settings, Hourglass, X, Search, Globe, LayoutGrid, Loader2, AlertTriangle, Link } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'dasas' | 'analysis'>('basic');
  const [showSettings, setShowSettings] = useState(false);
  
  const [details, setDetails] = useState<BirthDetails>({
    name: 'Native',
    date: '1990-01-01',
    time: '12:00',
    place: 'New Delhi, India',
    latitude: 28.61, // Delhi
    longitude: 77.20,
    timezone: 5.5, // IST
    ayanamsaType: AyanamsaType.LAHIRI, // Default
    makarandaMode: MakarandaMode.CLASSIC
  });

  const [isManualLocation, setIsManualLocation] = useState(false);
  const [cityQuery, setCityQuery] = useState('New Delhi');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [calcSettings, setCalcSettings] = useState<CalculationSettings>({
    lifecycleYears: 144,
    yearDefinition: 'SOLAR', 
    calendar: 'GREGORIAN' 
  });

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AiAnalysisResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showD9, setShowD9] = useState(true);
  
  // Connection Settings
  const [customApiUrl, setCustomApiUrl] = useState(getApiUrl());

  // Recalculate chart function (Async)
  const runCalculation = useCallback(async () => {
    setIsCalculating(true);
    setErrorMsg(null);
    try {
      const data = await calculateChart(details, calcSettings);
      setChartData(data);
      setAiReport(null); 
      setShowSettings(false);
    } catch (e: any) {
      console.error("Calculation Error", e);
      setErrorMsg(e.message || "Failed to connect to the calculation server.");
      setChartData(null);
    } finally {
      setIsCalculating(false);
    }
  }, [details, calcSettings]);

  // Initial Calculation
  useEffect(() => {
    runCalculation();
  }, []);

  const handleUpdateUrl = () => {
    setApiUrl(customApiUrl);
    runCalculation();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setDetails(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCalcSettings(prev => ({
      ...prev,
      [name]: name === 'lifecycleYears' ? parseInt(value) : value
    }));
  };

  const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityQuery(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.length > 2) {
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=5&language=en&format=json`);
                const data = await res.json();
                if (data.results) {
                    setSuggestions(data.results);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.error("Geocoding error", err);
            }
        }, 400);
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const calculateTimezoneOffset = (ianaTimezone: string, dateStr: string, timeStr: string) => {
    try {
        const d = new Date(`${dateStr}T${timeStr}`);
        const offsetStr = new Intl.DateTimeFormat("en-US", {
            timeZone: ianaTimezone,
            timeZoneName: "longOffset"
        }).format(d);
        
        const match = offsetStr.match(/GMT([+-])(\d+):?(\d+)?/);
        if (match) {
            const sign = match[1] === '+' ? 1 : -1;
            const hours = parseInt(match[2]);
            const minutes = match[3] ? parseInt(match[3]) : 0;
            return sign * (hours + minutes / 60);
        }
        return 0;
    } catch (e) {
        console.warn("Timezone calc failed", e);
        return 0; 
    }
  };

  const selectCity = (city: any) => {
      const offset = city.timezone ? calculateTimezoneOffset(city.timezone, details.date, details.time) : 0;
      
      setDetails(prev => ({
          ...prev,
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: offset,
          place: `${city.name}, ${city.country || ''}`,
      }));
      setCityQuery(`${city.name}, ${city.country || ''}`);
      setShowSuggestions(false);
  };

  const handleManualToggle = () => {
    setIsManualLocation(!isManualLocation);
  };

  const handleGenerateReport = useCallback(async () => {
    if (!chartData) return;
    setIsLoadingAi(true);
    try {
      const report = await generateAstrologyReport(chartData);
      setAiReport(report);
      setActiveTab('analysis');
    } catch (e) {
      alert("Please ensure your API Key is set in the environment.");
    } finally {
      setIsLoadingAi(false);
    }
  }, [chartData]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 font-sans relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
             <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
               <h3 className="font-serif-header text-amber-500 text-lg">Lifecycle Calculation Settings</h3>
               <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
             </div>
             <div className="p-6 space-y-6">
                <div className="text-sm text-slate-400 italic">
                  Settings aligned with Jagannatha Hora defaults.
                </div>
                
                <div>
                   <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Lifecycle length in years</label>
                   <input 
                     type="number" 
                     name="lifecycleYears"
                     value={calcSettings.lifecycleYears}
                     onChange={handleSettingsChange}
                     className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                   />
                </div>

                <div>
                   <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Definition of a year</label>
                   <select 
                      name="yearDefinition"
                      value={calcSettings.yearDefinition}
                      onChange={handleSettingsChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                   >
                      <option value="360_TITHIS">Year with 360 tithis (Lunar)</option>
                      <option value="SOLAR">Solar Year (365.2425 days)</option>
                   </select>
                </div>

                <div>
                   <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Calendar System</label>
                   <select 
                      name="calendar"
                      value={calcSettings.calendar}
                      onChange={handleSettingsChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                   >
                      <option value="GREGORIAN">Gregorian (New Style)</option>
                      <option value="JULIAN">Julian (Old Style)</option>
                      <option value="MIXED">Mixed (Julian before 1582)</option>
                   </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                   <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-slate-400 text-sm hover:text-white">Cancel</button>
                   <button onClick={runCalculation} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-medium transition-colors">OK</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <h1 className="text-2xl font-serif-header text-amber-500 flex items-center gap-2">
            <Star className="w-6 h-6" /> JyotishWeb
          </h1>
          <p className="text-xs text-slate-400 mt-1 tracking-wide">J.Hora Web Analog</p>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Name</label>
              <input 
                type="text" 
                name="name" 
                value={details.name} 
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><Calendar size={10}/> Date</label>
                <input 
                  type="date" 
                  name="date" 
                  value={details.date} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><Clock size={10}/> Time</label>
                <input 
                  type="time" 
                  name="time" 
                  value={details.time} 
                  step="60"
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <MapPin size={10}/> Location
                    </label>
                    <button 
                        onClick={handleManualToggle}
                        className="text-[10px] text-amber-600 hover:text-amber-500 underline"
                    >
                        {isManualLocation ? "Search City" : "Enter Manual Coordinates"}
                    </button>
                </div>

                {!isManualLocation ? (
                    <div className="relative">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Start typing city..."
                                value={cityQuery}
                                onChange={handleCitySearch}
                                className="w-full bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                            />
                            <Search className="absolute left-2.5 top-2.5 text-slate-500 w-4 h-4" />
                        </div>
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl max-h-48 overflow-y-auto">
                                {suggestions.map((city, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => selectCity(city)}
                                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-xs text-slate-200 border-b border-slate-700/50 flex flex-col"
                                    >
                                        <span className="font-medium">{city.name}</span>
                                        <span className="text-[10px] text-slate-400">{city.admin1 ? `${city.admin1}, ` : ''}{city.country}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                             <span>Lat: {details.latitude.toFixed(4)}</span>
                             <span>Long: {details.longitude.toFixed(4)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <div>
                        <input 
                            type="number" 
                            name="latitude" 
                            placeholder="Lat"
                            value={details.latitude} 
                            onChange={handleInputChange}
                            step="0.0001"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        <span className="text-[10px] text-slate-600">Latitude (N+)</span>
                        </div>
                        <div>
                        <input 
                            type="number" 
                            name="longitude" 
                            placeholder="Long"
                            value={details.longitude} 
                            onChange={handleInputChange}
                            step="0.0001"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        <span className="text-[10px] text-slate-600">Longitude (E+)</span>
                        </div>
                    </div>
                )}
            </div>

             <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Globe size={10}/> Timezone (GMT Offset)
                </label>
                <input 
                  type="number" 
                  name="timezone" 
                  value={details.timezone} 
                  onChange={handleInputChange}
                  step="0.5"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <div className="flex justify-between mt-1">
                   <p className="text-[10px] text-slate-500">Auto-calculated if city selected</p>
                </div>
            </div>

            <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><Settings size={10}/> Ayanamsa</label>
                <select 
                    name="ayanamsaType"
                    value={details.ayanamsaType}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                >
                    {Object.values(AyanamsaType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            {details.ayanamsaType === AyanamsaType.SSS_MAKARANDA && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><LayoutGrid size={10}/> Makaranda System</label>
                <select
                    name="makarandaMode"
                    value={details.makarandaMode}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                >
                    {Object.values(MakarandaMode).map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                    ))}
                </select>
                <div className="mt-2 text-xs text-slate-500">
                  Classic keeps the current Makaranda engine. Research runs the new experimental Moon model separately.
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 mt-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full text-left text-xs text-amber-600 hover:text-amber-500 flex items-center gap-1 mb-3"
                >
                   <Settings size={12}/> Calculation Preferences...
                </button>
                
                <button 
                    onClick={runCalculation}
                    disabled={isCalculating}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs uppercase tracking-wider rounded font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                    {isCalculating ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3" />}
                    {isCalculating ? "Calculating..." : "Recalculate Chart"}
                </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
             <button 
                onClick={handleGenerateReport}
                disabled={isLoadingAi || isCalculating || !chartData}
                className="w-full py-3 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/30"
             >
                {isLoadingAi ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                    <Sparkles className="w-4 h-4" />
                )}
                Analyze with AI
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-6 sticky top-0 bg-slate-950 z-10 pt-2 gap-4">
          <button 
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Charts & Positions
          </button>
          <button 
            onClick={() => setActiveTab('dasas')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dasas' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Vimsottari Dasas
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            AI Interpretation
          </button>
        </div>

        {errorMsg && (
            <div className="bg-red-900/20 border border-red-700/50 text-red-200 p-4 rounded-lg flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                        <h3 className="font-bold text-sm">Calculation Service Unavailable</h3>
                        <p className="text-xs opacity-80">{errorMsg}</p>
                    </div>
                </div>
                
                <div className="ml-9 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                        Backend API URL (Change if running on different port/host)
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link className="absolute left-2.5 top-2.5 text-slate-500 w-3 h-3" />
                            <input 
                                type="text" 
                                value={customApiUrl}
                                onChange={(e) => setCustomApiUrl(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded pl-8 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                            />
                        </div>
                        <button 
                            onClick={handleUpdateUrl}
                            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded transition-colors"
                        >
                            Update & Retry
                        </button>
                    </div>
                    <p className="text-[10px] mt-2 text-slate-500 italic">
                        Note: Ensure <code>node server.js</code> is running. Default is <code>http://127.0.0.1:3000/api/calculate</code>.
                    </p>
                </div>
            </div>
        )}

        {isCalculating && !chartData && !errorMsg ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                <p>Calculating Planetary Positions (Server)...</p>
             </div>
        ) : activeTab === 'basic' && chartData ? (
          <div className="animate-fade-in">
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
               
               {/* D1 Rasi */}
               <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <h3 className="text-sm font-serif-header text-amber-500 uppercase tracking-wider">Rasi Chart (D-1)</h3>
                        <span className="text-[10px] text-slate-500">Root Chart</span>
                    </div>
                    <div className="bg-slate-900 p-1 rounded-sm shadow-2xl shadow-black relative group">
                        <SouthIndianChart 
                            data={chartData} 
                            title="RASI" 
                            subTitle="D-1 Chart"
                        />
                    </div>
               </div>

               {/* D9 Navamsa (Optional Toggle) */}
               {showD9 && (
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <h3 className="text-sm font-serif-header text-amber-500 uppercase tracking-wider">Navamsa Chart (D-9)</h3>
                        <span className="text-[10px] text-slate-500">Marriage & Strength</span>
                    </div>
                    <div className="bg-slate-900 p-1 rounded-sm shadow-2xl shadow-black relative group">
                        <SouthIndianChart 
                            planets={chartData.divisional.d9.planets}
                            ascendant={chartData.divisional.d9.ascendant}
                            title="NAVAMSA" 
                            subTitle="D-9 Chart"
                        />
                    </div>
                </div>
               )}
            </div>

            {/* Toggle Button for D9 */}
            <div className="flex justify-end mb-6">
                <button 
                    onClick={() => setShowD9(!showD9)}
                    className="text-xs flex items-center gap-2 px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                >
                    <LayoutGrid size={12}/> {showD9 ? "Hide Navamsa" : "Show Navamsa"}
                </button>
            </div>

            {/* Details Table */}
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Ascendant</div>
                      <div className="text-lg font-mono text-white">
                         {Math.floor(chartData.ascendant.degree)}° {( (chartData.ascendant.degree % 1) * 60).toFixed(0)}'
                      </div>
                      <div className="text-xs text-amber-500 mt-1">
                          In {chartData.ascendant.sign}
                      </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Ayanamsa: {chartData.ayanamsaType}</div>
                      <div className="text-sm text-slate-300 font-mono">
                         {chartData.ayanamsa}
                      </div>
                  </div>
                   <div className="bg-slate-900 border border-slate-800 p-3 rounded">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Calculation</div>
                      <div className="text-xs text-slate-400">
                          {chartData.settingsUsed.yearDefinition === 'SOLAR' ? 'Solar Years' : '360 Tithis'}
                          <br/>
                          Mean Nodes, Geocentric
                      </div>
                      {chartData.makarandaMode && (
                        <div className="mt-2 text-xs text-amber-400">{chartData.makarandaMode}</div>
                      )}
                  </div>
               </div>

              <h3 className="text-lg font-serif-header text-amber-500 mb-2">Planetary Positions</h3>
              <PlanetaryTable data={chartData} />
            </div>
          </div>
        ) : null}

        {activeTab === 'dasas' && chartData && (
            <div className="animate-fade-in max-w-4xl">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                         <h3 className="text-xl font-serif-header text-amber-500">Vimsottari Dasa</h3>
                         <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Hourglass size={12}/> Year Length: {chartData.settingsUsed.yearDefinition === '360_TITHIS' ? '360 Tithis (Lunar ~354.37d)' : 'Solar (365.24d)'}
                         </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/40">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs uppercase bg-slate-900 text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Mahadasa Lord</th>
                            <th className="px-6 py-4">Start Date</th>
                            <th className="px-6 py-4">End Date</th>
                            <th className="px-6 py-4 text-center">Duration</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {chartData.dasas.map((dasa, idx) => (
                            <tr key={idx} className={`border-b border-slate-700/50 ${dasa.isCurrent ? 'bg-amber-900/20' : 'hover:bg-slate-800/50'}`}>
                                <td className="px-6 py-4 font-medium text-amber-400">{dasa.lord}</td>
                                <td className="px-6 py-4 font-mono text-slate-300">{dasa.startDate}</td>
                                <td className="px-6 py-4 font-mono text-slate-300">{dasa.endDate}</td>
                                <td className="px-6 py-4 text-center text-slate-500">{dasa.durationYears} yrs</td>
                                <td className="px-6 py-4 text-center">
                                    {dasa.isCurrent ? (
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-900 uppercase">
                                            Running
                                        </span>
                                    ) : (
                                        <span className="text-slate-600">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'analysis' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {!aiReport ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                 <Sparkles className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                 <h3 className="text-xl text-slate-300 font-serif-header">Ready for Analysis</h3>
                 <p className="text-slate-500 mt-3 max-w-md mx-auto">Click "Analyze with AI" in the sidebar to generate a professional Vedic Astrology reading based on the calculated chart.</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-8 shadow-2xl">
                   <h3 className="text-2xl font-serif-header text-amber-500 mb-6 border-b border-slate-700 pb-4">Chart Summary</h3>
                   <p className="text-slate-200 text-lg leading-relaxed font-light">{aiReport.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-indigo-900/50 transition-colors">
                       <h4 className="text-lg font-serif-header text-indigo-400 mb-4 flex items-center gap-2">
                           <Star size={16}/> Key Yogas
                       </h4>
                       <ul className="space-y-3">
                          {aiReport.yogas.map((yoga, i) => (
                             <li key={i} className="flex items-start gap-3 text-slate-300">
                                <span className="text-indigo-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                <span className="text-sm">{yoga}</span>
                             </li>
                          ))}
                       </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-emerald-900/50 transition-colors">
                         <h4 className="text-lg font-serif-header text-emerald-400 mb-4 flex items-center gap-2">
                             <Sparkles size={16}/> Prediction & Current Dasa
                         </h4>
                         <p className="text-sm text-slate-300 leading-relaxed">
                             {aiReport.prediction}
                         </p>
                    </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
