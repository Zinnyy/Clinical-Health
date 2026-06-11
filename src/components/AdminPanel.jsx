import React, { useState, useEffect } from 'react';

export default function AdminPanel({onBack}) {

const [activeTab, setActiveTab] = useState('users');

const[users, setUsers] = useState([]);
const[clinicalData, setClinicalData] = useState([]);
const[loading, setLoading] = useState(true);
const[errorMessage, setErrorMessage] = useState('');

const[userId, setUserId] = useState(null);
const[username, setUsername] = useState('');
const[email, setEmail] = useState('');
const[role, setRole] = useState('Operator');
const[password, setPassword] = useState('');
const[fullName, setFullName] = useState('');
const[isEditing, setIsEditing] = useState(false);
const[submitLoading, setSubmitLoading] = useState(false);

const API_BASE = 'https://health-information.onrender.com';

const fetchAdminData = async () => {

    setLoading(true);
    setErrorMessage('');
    const token = localStorage.getItem('jwtToken');
    const endpoint = activeTab === 'users' ? '/api/Admin/users' : '/api/Admin/patients/detailed';

   try{
        const response = await fetch(API_BASE + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if(response.ok){
            const data = await response.json();
            if(activeTab === 'users'){
                setUsers(Array.isArray(data) ? data : []);
            }else {
                setClinicalData(Array.isArray(data) ? data : []);
            }
        }   
            else{
                setErrorMessage(`Security core rejected query. Status code: ${response.status}`);
            }
        }
        catch(err){
            setErrorMessage('Failed to resolve synchronization tunnel with backend server. Please check your network connection and try again.');
        }finally{
            
            setLoading(false);
        }
};

 useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // 2. Handle Staff User Upsert (Create / Update)
  const handleUserUpsert = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage('');

    const token = localStorage.getItem('jwtToken');
    const endpoint = isEditing ? '/api/Admin/users/update' : '/api/Admin/users/create';
    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      Id: userId,
      Username: username,
      FullName: fullName,
      Email: email,
      Password: password,
      Role: role
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        clearForm();
        fetchAdminData();
      } else {
        const errJson = await response.json().catch(() => ({}));
        setErrorMessage(errJson.message || 'The administrative request was rejected.');
      }
    } catch (err) {
      setErrorMessage('Network failure during administrative transaction packet delivery.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 3. Delete Operator User account (Soft Delete)
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Revoke all system access keys and soft-delete this operator?")) return;
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch(`${API_BASE}/api/Admin/users/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchAdminData();
    } catch (err) {
      setErrorMessage('Failed to submit user revocation packet.');
    }
  };

  // 4. Master Clinical Patient Purge Override
  const handleMasterPurge = async (id, studyId) => {
    if (!window.confirm(`CRITICAL SECURITY OVERRIDE:\nExpunge patient card ${studyId} and ALL cascading SQL vital records?`)) return;
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch(`${API_BASE}/api/Admin/patients/purge/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchAdminData();
    } catch (err) {
      setErrorMessage('Failed to process administrative hard-purge command.');
    }
  };

  const populateEdit = (user) => {
    setUserId(user.id);
    setUsername(user.username);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role || 'Operator');
    setPassword(''); // Leave blank unless changing
    setIsEditing(true);
  };

  const clearForm = () => {
    setUserId(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('Operator');
    setIsEditing(false);
  };
 return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      
      {/* Top Breadcrumb System Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-100 hover:border-gray-200 bg-white rounded-xl text-sm font-bold text-gray-600 transition-all active:scale-95 shadow-sm" onClick={onBack}>
            <i className="bi bi-arrow-left"></i>
            <span>Exit Admin Mode</span>
          </button>
          
          <div className="flex bg-gray-200/60 p-1 rounded-xl">
            <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('users')}>
              Staff Directory
            </button>
            <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'clinical' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('clinical')}>
              Clinical Oversight
            </button>
          </div>
        </div>

        <div className="text-end bg-white border border-gray-100 px-5 py-2.5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Terminal Authority</span>
          <h5 className="text-sm font-bold text-red-500 font-mono tracking-wide m-0 mt-0.5 flex items-center">
            <i className="bi bi-shield-lock-fill me-1.5 animate-pulse"></i> Root Administrator
          </h5>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 mb-6 rounded-2xl text-sm font-medium text-center bg-red-50 text-red-600 border border-red-200">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMessage}
        </div>
      )}

      {/* VIEW PANEL CONDITIONAL SWITCH */}
      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT INTERIOR COLUMN: Staff Management Upsert Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <i className="bi bi-person-gear text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Modify Account' : 'Provision User'}</h3>
                <p className="text-xs text-gray-400 font-medium">Manage clinical staff access tokens</p>
              </div>
            </div>

            <form onSubmit={handleUserUpsert} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Full Operator Name</label>
                <input type="text" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none text-sm text-gray-800 font-medium" placeholder="Dr. Sarah Jenkins" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Secure Email</label>
                <input type="email" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none text-sm text-gray-800 font-medium" placeholder="s.jenkins@clinic.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Account Username</label>
                <input type="text" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none text-sm text-gray-800 font-medium" placeholder="sjenkins" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Security Password {isEditing && '(Optional)'}</label>
                <input type="password" className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none text-sm text-gray-800 font-medium" placeholder={isEditing ? "••••••••" : "Enter password"} value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditing} />
              </div>
         <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Security Security Role</label>
                <select className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-white focus:border-violet-500 outline-none text-sm text-gray-800 font-medium" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Operator">Operator (Standard Staff)</option>
                  <option value="Admin">Admin (Root System Controller)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                {isEditing && (
                  <button type="button" className="flex-1 py-3 border-2 border-gray-100 hover:border-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all" onClick={clearForm}>
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={submitLoading} className="flex-1 py-3 bg-violet-500 text-white rounded-xl text-sm font-bold flex justify-center items-center shadow-md shadow-violet-100">
                  {submitLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : isEditing ? "Save Edits" : "Deploy User"}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT INTERIOR COLUMN: Staff List Directory Display */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Active Staff Directory</h4>
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-gray-400 font-bold uppercase bg-gray-50/50">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Username</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">System Role</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-2 font-mono text-gray-400">#{u.id}</td>
                        <td className="py-3.5 px-2 font-bold text-gray-800">{u.fullName}</td>
                        <td className="py-3.5 px-2 font-mono text-violet-600">{u.username}</td>
                        <td className="py-3.5 px-2 text-gray-600">{u.email}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${u.role === 'Admin' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                        </td>
                        <td className="py-3.5 px-2 text-right space-x-1">
                          <button className="p-1 text-gray-400 hover:text-violet-600" onClick={() => populateEdit(u)} type="button"><i className="bi bi-pencil-square"></i></button>
                          <button className="p-1 text-gray-400 hover:text-red-500" onClick={() => handleDeleteUser(u.id)} type="button"><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MASTER CLINICAL OVERLAY WORKSPACE VIEW (Includes Nested Vitals lists) */
        <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Master Audit Database Log</h4>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="space-y-4">
              {clinicalData.length === 0 ? (
                <p className="text-center py-8 text-gray-400 font-medium text-sm">No electronic health registries active in relational tables.</p>
              ) : (
                clinicalData.map((patient) => (
                  <div key={patient.id} className="border-2 border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-all bg-gray-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-lg font-bold text-violet-600 font-mono tracking-wide">{patient.patientStudyId}</span>
                        <span className="text-xs text-gray-400 font-semibold font-mono">DB-Ref: #{patient.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{patient.age} yrs • {patient.gender}</span>
                      </div>
                      
                      {/* Nested vital loops checklist */}
                      <div className="mt-3 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider me-1">Compiled Records ({patient.vitalRecords?.length || 0}):</span>
                        {patient.vitalRecords && patient.vitalRecords.length > 0 ? (
                          patient.vitalRecords.map((v, idx) => (
                            <span key={v.id || idx} className="bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-xl text-[11px] font-medium shadow-inner">
                              HR: <span className="font-bold text-red-500">{v.heartRate}</span> | BP: <span className="font-bold text-orange-500">{v.systolicBp || v.SystolicBp}</span> | Gluc: <span className="font-bold text-green-600">{v.glucose}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">Biometric snapshot database rows empty for this entity.</span>
                        )}
                      </div>
                    </div>

                    <button className="w-full md:w-auto inline-flex items-center justify-center space-x-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-transparent active:scale-95" onClick={() => handleMasterPurge(patient.id, patient.patientStudyId)}>
                      <i className="bi bi-shield-alert me-1"></i> Purge History File
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
     
}