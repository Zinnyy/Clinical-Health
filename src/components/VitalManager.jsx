import React, { useState, useEffect } from 'react';

export default function VitalManager({ selectedPatient, onBack }) {
  // Metric tracking input fields
  const [heartRate, setHeartRate] = useState('');
  const [systolicBP, setSystolicBP] = useState(''); // Holds UI form input
  const [glucose, setGlucose] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Core historic lists and visualization states
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [chartUrl, setChartUrl] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  //AI Prediction and Analysis states
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const API_BASE = "https://health-information.onrender.com"; 

  // 1. GET /api/VitalRecord/patient/{id} — Fetch history logs from database
  const fetchVitalHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE}/api/VitalRecord/patient/${selectedPatient.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVitalsHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to sync vital logs:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 2. GET /api/VitalRecord/Report/{patientid} — Request Python Matplotlib Image Link
  const fetchChartReport = async () => {
    setLoadingChart(true);
    setChartUrl('');
    try {
      const response = await fetch(`${API_BASE}/api/VitalRecord/Report/${selectedPatient.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.chartUrl) {
          // Prepend server origin and add a timestamp token to bypass browser image caching
          setChartUrl(`${API_BASE}${data.chartUrl}?t=${new Date().getTime()}`);
        }
      }
    } catch (err) {
      setErrorMessage("The analytics processing sub-routine timed out.");
    } finally {
      setLoadingChart(false);
    }
  };

  // 3. GET /api/VitalRecord/analyze-vitals/{patientid} — Request AI analysis of vitals
  const fetchAIAnalysis = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch(`${API_BASE}/api/VitalRecord/analyze-vitals/${selectedPatient.id}`,  {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      if (response.ok){
        const data = await response.json();
        if(data && data.AiInsights){
          setAiInsight(data.AiInsights);
        }else if(data && data.aiInsights){
          setAiInsight(data.aiInsights);
        }
      }
    }catch(err){
      console.error("Failed to fetch AI analysis:", err);
    }finally{
      setLoadingAi(false);
    }
  }

  useEffect(() => {
    if (selectedPatient) {
      fetchVitalHistory();
      fetchChartReport();
      fetchAIAnalysis();
    }
  }, [selectedPatient]);

  // 3. POST /api/VitalRecord/create — Dispatches clean metrics
  const handleLogVitals = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage('');

    // Payload perfectly aligned to VitalRecord.cs entity mappings
    const payload = {
      PatientId: selectedPatient.id,
      HeartRate: parseInt(heartRate),
      SystolicBp: parseInt(systolicBP), // Matched to lowercase 'p' property
      Glucose: parseInt(glucose),
      DateRecorded: new Date().toISOString() // Injects the required timestamp string
    };

    try {
      const response = await fetch(`${API_BASE}/api/VitalRecord/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setHeartRate('');
        setSystolicBP('');
        setGlucose('');
        
        // Instantly reload database data and trigger the Python compiler to update charts
        fetchVitalHistory();
        fetchChartReport();
        fetchAIAnalysis();
      } else {
        setErrorMessage("Biometric structure configuration rejected by server schema.");
      }
    } catch (err) {
      setErrorMessage("Network loss during packet delivery dispatch.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 4. DELETE /api/VitalRecord/{id} — Delete record from data table
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Purge this metric tracking log permanently?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/VitalRecord/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      if (response.ok) {
        fetchVitalHistory();
        fetchChartReport();
        fetchAIAnalysis();
      }
    } catch (err) {
      setErrorMessage("Failed to submit entry removal pipeline request.");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      
      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
        <button 
          className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-100 hover:border-gray-200 bg-white rounded-xl text-sm font-bold text-gray-600 transition-all active:scale-95 shadow-sm" 
          onClick={onBack}
          type="button"
        >
          <i className="bi bi-arrow-left text-base"></i>
          <span>Return to Registry</span>
        </button>
        
        <div className="sm:text-end bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Clinical Tracking Case File</span>
          <h5 className="text-xl font-bold text-violet-600 font-mono tracking-wide m-0 mt-0.5">
            {selectedPatient.patientStudyId}
          </h5>
        </div>
      </div>
   {/* Local Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 mb-6 rounded-2xl text-sm font-medium text-center bg-red-50 text-red-600 border border-red-200">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMessage}
        </div>
      )}

 {/* Feature 2: Only attempt rendering if the patient has data points logged */}
      {vitalsHistory.length > 0 && (
        <>
          {/* Feature 1: Pulse skeleton loaders when the Python model is processing */}
        {loadingAi ? (
            <div className="mb-6 p-6 rounded-3xl border-2 border-gray-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="flex items-center space-x-4 md:border-l md:border-gray-100 md:pl-6">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </div>
              </div>
            </div>
          ) : (
            /* Render actual AI insights data when loaded */
            aiInsight && (
              <div className={`mb-6 p-6 rounded-3xl border-2 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm transition-all duration-300 ${
                aiInsight.status === 'Anomaly Alert'
                  ? 'bg-rose-50 border-rose-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                
                {/* Card Module 1: Diagnostic Risk Classification */}
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${aiInsight.status === 'Anomaly Alert' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    <i className={`bi ${aiInsight.status === 'Anomaly Alert' ? 'bi-shield-fill-exclamation' : 'bi-shield-fill-check'} text-xl`}></i>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">ML Classification</span>
                    <h4 className="text-lg font-bold text-gray-900 mt-0.5">
                      {aiInsight.status === 'Anomaly Alert' ? "Biometric Anomaly Alert" : "Vitals Status Stable"}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Random Forest cluster analysis framework</p>
                  </div>
                </div>

                {/* Card Module 2: Continuous Risk Scale Probability */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Index Profile</span>
                    <span className="text-xs font-bold text-gray-700">{aiInsight.riskIndex}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${aiInsight.status === 'Anomaly Alert' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${aiInsight.riskIndex}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">Statistical deviation margin evaluation</p>
                </div>

                {/* Card Module 3: Clinical Urgency Metric Triage */}
                <div className="flex items-start space-x-4 md:border-l md:border-gray-200 md:pl-6">
                  <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <i className="bi bi-activity text-xl text-violet-600"></i>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Clinical Action Tier</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 shadow-sm ${
                      aiInsight.actionTier === 'Critical' ? 'bg-red-500 text-white' : 
                      aiInsight.actionTier === 'Moderate Warning' ? 'bg-amber-400 text-gray-900' : 
                      'bg-emerald-500 text-white'
                    }`}>
                      {aiInsight.actionTier}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-wider">AI Guardrail Checklist Attached</p>
                  </div>
                </div>

              </div>
            )
          )}
        </>
      )}



      {/* Main Workspace Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Input Matrix and Log Directories (4 Columns wide) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Biometric Intake Form Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <i className="bi bi-heart-pulse-fill text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Log Metrics</h3>
                <p className="text-xs text-gray-400 font-medium">Record patient snapshot vital records</p>
              </div>
            </div>

            <form onSubmit={handleLogVitals} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Heart Rate (BPM)</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium text-sm" 
                  placeholder="e.g. 75" 
                  value={heartRate} 
                  onChange={(e) => setHeartRate(e.target.value)} 
                  required 
                  min="20" 
                  max="250" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Systolic Pressure (mmHg)</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium text-sm" 
                  placeholder="e.g. 118" 
                  value={systolicBP} 
                  onChange={(e) => setSystolicBP(e.target.value)} 
                  required 
                  min="40" 
                  max="300" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Serum Glucose (mg/dL)</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium text-sm" 
                  placeholder="e.g. 90" 
                  value={glucose} 
                  onChange={(e) => setGlucose(e.target.value)} 
                  required 
                  min="10" 
                  max="600" 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={submitLoading} 
                  className="w-full active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3 bg-violet-500 text-white rounded-xl text-sm font-bold flex justify-center items-center shadow-md shadow-violet-100"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : "Commit Parameters"}
                </button>
              </div>
            </form>
          </div>

          {/* Historical Record Log Directory Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Historical Snapshots</h4>
            
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[220px] rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">HR</th>
                      <th className="py-2.5 px-3">BP</th>
                      <th className="py-2.5 px-3">Glucose</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vitalsHistory.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-gray-400 font-medium">
                          No logging snapshots active.
                        </td>
                      </tr>
                    ) : (
                      vitalsHistory.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-2.5 px-3 text-gray-700 font-medium">{v.heartRate || v.HeartRate} bpm</td>
                          <td className="py-2.5 px-3 text-gray-700 font-medium">{v.systolicBp || v.SystolicBp || v.systolicBP} mmHg</td>
                          <td className="py-2.5 px-3 text-gray-700 font-medium">{v.glucose || v.Glucose} mg/dL</td>
                          <td className="py-2.5 px-3 text-right">
                            <button 
                              type="button" 
                              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                              onClick={() => handleDeleteRecord(v.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Python Visual Report Workspace Canvas (8 Columns wide) */}
        <div className="lg:col-span-8 h-full">
          <div className="bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-sm flex flex-col min-h-[515px]">
            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <i className="bi bi-bar-chart-line-fill text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Python Analytics Visualization Core</h2>
                <p className="text-xs text-gray-400 font-medium">Pandas & Matplotlib background engine stream</p>
              </div>
            </div>

            {/* Canvas Display Viewport Area */}
            <div className="flex-1 flex flex-col justify-center items-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 p-4">
              {loadingChart ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm font-semibold text-gray-500">Compiling dataset data matrices...</p>
                  <p className="text-xs text-gray-400 mt-1">Executing C# Python memory stream pipeline</p>
                </div>
              ) : chartUrl ? (
                <div className="w-full bg-white p-3 border border-gray-100 rounded-2xl shadow-sm max-w-xl transition-all hover:shadow-md">
                  <img 
                    src={`${chartUrl}?t=${new Date().getTime()}`}
                    alt="Clinical Metrics Analysis Representation" 
                    className="w-full h-auto rounded-xl object-contain max-h-[380px]" 
                  />
                </div>
              ) : (
                <div className="text-center py-16 px-4 max-w-sm">
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-gray-200/50">
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">Visualization Display Offline</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Commit clinical metric record parameters on the left to trigger the automated background script generation sequence.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}