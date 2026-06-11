import React, { useState, useEffect } from 'react';
import VitalManager from './VitalManager'; // 1. IMPORT THE VITAL MANAGER HERE

export default function PatientRegistry({userRole, onSwitchToAdmin}) {
  // Roster and global message tracking states
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Intake Form fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [submitLoading, setSubmitLoading] = useState(false);

  // DYNAMIC VIEW STATE: Tracks if an operator clicked "Analyze" on a patient
  const [selectedPatient, setSelectedPatient] = useState(null);
 //update
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState(null);
 const [editPatientStudyId, setEditPatientStudyId] = useState('');
 const [editAge, setEditAge] = useState('');
 const [editGender, setEditGender] = useState('Male');
 const [updateLoading, setUpdateLoading] = useState(false);

 //delete
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [deletePatientId, setDeletePatientId] = useState(null);
 const[ deletePatientStudyId, setDeletePatientStudyId] = useState('');

  const API_BASE = "https://health-information.onrender.com"; 

  // 1. GET /api/Patient/all - Fetch complete registry roster
  const fetchPatients = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/Patient/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(Array.isArray(data) ? data : []);
      } else {
        setErrorMessage(`Roster download failed. Server response code: ${response.status}`);
      }
    } catch (err) {
      setErrorMessage('Network transmission failure. Verify backend API execution and CORS configs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // 2. POST /api/Patient/create - Dispatch structural data record
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage('');
  
    const activeUserid = localStorage.getItem('currentUserId') || "1"; 
    const payload = {
      PatientStudyId: "", 
      Age: parseInt(age),
      Gender: gender,
      CreatedById: parseInt(activeUserid) 
    };

    try {
      const response = await fetch(`${API_BASE}/api/Patient/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAge('');
        setGender('Male');
        fetchPatients(); 
      } else {
        const errJson = await response.json().catch(() => ({}));
        setErrorMessage(errJson.message || 'The backend core rejected the entity parameters.');
      }
    } catch (err) {
      setErrorMessage('Communication error dispatched from database channel.');
    } finally {
      setSubmitLoading(false);
    }
  };

  //update patient
  const openEditModal = (patient) => {
    setEditPatientId(patient.id);
    setEditPatientStudyId(patient.patientStudyId || '');
    setEditAge(patient.age);
    setEditGender(patient.gender);
    setIsEditModalOpen(true);
  };

  //put /api/Patient/update/{id} - Update existing patient record with new parameters
  const handleUpdatePatient = async (e) => {
  e.preventDefault();
  setUpdateLoading(true);
  setErrorMessage('');

  const activeUserId = localStorage.getItem('currentUserId') || "1";

  // Formulating data envelope matching your C# Patient.cs structure requirements
  const payload = {
    Id: editPatientId,
    PatientStudyId: editPatientStudyId, // Preserves the generated auto-code string
    Age: parseInt(editAge),
    Gender: editGender,
    CreatedById: parseInt(activeUserId) // Tracks which shift worker made the adjustment
  };

  try {
    const response = await fetch(`${API_BASE}/api/Patient/Update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setIsEditModalOpen(false); // Cleanly drop pop-up display grid
      fetchPatients(); // Instantly sync table matrix records with SQL database
    } else {
      const errJson = await response.json().catch(() => ({}));
      setErrorMessage(errJson.message || 'Database core rejected structural parameters.');
    }
  } catch (err) {
    setErrorMessage('Network connection lost during patient entry update dispatch.');
  } finally {
    setUpdateLoading(false);
  }
};

  // 3. DELETE /api/Patient/{id} - Wipe record from storage table
  const handleDeletePatient = async (id) => {
    if (!window.confirm("Confirm permanent removal of this anonymized clinical subject?")) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/Patient/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });

      if (response.ok) {
        fetchPatients(); 
      } else {
        setErrorMessage(`Deletion operation rejected by security framework.`);
      }
    } catch (err) {
      setErrorMessage('Failed to submit destructive pipeline transmission request.');
    }
  };

  // SCREEN SWAP LOGIC: If a patient profile is active, hand over the HTML rendering to VitalManager
  if (selectedPatient) {
    return (
      <VitalManager 
        selectedPatient={selectedPatient} 
        onBack={() => {
          setSelectedPatient(null); // Clears active patient to pull you back to the main list
          fetchPatients(); // Refreshes roster metrics on return
        }} 
      />
    );
  }

  // Standard Main Table Layout
  return (
     <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      
      {/* Dashboard Global Error Notification */}
      {errorMessage && (
        <div className="p-4 mb-6 rounded-2xl text-sm font-medium text-center bg-red-50 text-red-600 border border-red-200">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMessage}
        </div>
      )}

       {/* DYNAMIC ADMIN NAVIGATION ACCESS LINK */}
      {(userRole === 'Admin' || localStorage.getItem('userRole') === 'Admin') && (
        <div className="w-full bg-red-50 border-2 border-red-200 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500 text-white rounded-2xl">
              <i className="bi bi-shield-lock-fill text-xl"></i>
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Elevated Administrative Session Authorized</h4>
              <p className="text-xs text-gray-500 font-medium">Click to interact with the structural active staff directory directories.</p>
            </div>
          </div>
          <button onClick={onSwitchToAdmin} className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95">
            <span>Launch Admin Portal</span>
            <i className="bi bi-arrow-right-short text-lg"></i>
          </button>
        </div>
      )}

      {/* Main Content Splitting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Modern, Highly Organized Intake Module (4 Columns wide) */}
        <div className="lg:col-span-4 bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
              <i className="bi bi-person-plus-fill text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Patient Intake</h2>
              <p className="text-xs text-gray-400 font-medium">Initialize clinical file registry</p>
            </div>
          </div>
          
          <form onSubmit={handleAddPatient} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-600">Age (Years)</label>
              <input 
                type="number" 
                className="w-full border-2 border-gray-100 rounded-xl p-3.5 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium" 
                placeholder="e.g. 42" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                required 
                min="0" 
                max="125" 
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Biological Gender Classification</label>
              <select 
                className="w-full border-2 border-gray-100 rounded-xl p-3.5 mt-1 bg-white focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium appearance-none" 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={submitLoading} 
                className="w-full active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3.5 rounded-xl bg-violet-500 text-white text-base font-bold flex justify-center items-center shadow-md shadow-violet-100"
              >
                {submitLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <i className="bi bi-shield-plus me-2"></i>Initialize Registry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Sleek, High-Definition Database Directory (8 Columns wide) */}
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <i className="bi bi-hdd-network text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Active Patient Database</h2>
                <p className="text-xs text-gray-400 font-medium">Anonymized electronic health roster</p>
              </div>
            </div>
            
            <button 
              className="flex items-center space-x-1.5 px-3.5 py-2 border-2 border-gray-100 hover:border-gray-200 rounded-xl text-xs font-bold text-gray-600 transition-all bg-transparent"
              onClick={fetchPatients} 
              disabled={loading}
              type="button"
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'animate-spin text-violet-500' : ''}`}></i>
              <span>Sync Database</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center my-16 space-y-3">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-gray-400">Querying SQL partitions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-xs font-bold text-gray-400 tracking-wider uppercase bg-gray-50/50">
                    <th className="py-4 px-3">Key</th>
                    <th className="py-4 px-3">Study Code String</th>
                    <th className="py-4 px-3">Age</th>
                    <th className="py-4 px-3">Gender</th>
                    <th className="py-4 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-sm font-medium text-gray-400">
                        No active registry records returned from clinical database entity.
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-3 text-xs font-bold text-gray-400 font-mono">#{p.id}</td>
                        <td className="py-4 px-3 text-sm font-bold text-violet-600 font-mono tracking-wide">{p.patientStudyId || "PENDING"}</td>
                        <td className="py-4 px-3 text-sm font-semibold text-gray-700">{p.age} yrs</td>
                        <td className="py-4 px-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.gender === 'Male' 
                              ? 'bg-blue-50 text-blue-600' 
                              : p.gender === 'Female' 
                              ? 'bg-pink-50 text-pink-600' 
                              : 'bg-purple-50 text-purple-600'
                          }`}>
                            {p.gender}
                          </span>
                        </td>
                    <td className="py-4 px-3 text-right space-x-2 whitespace-nowrap">
                      {/* 1. ANALYZE BUTTON */}
                      <button 
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-xs font-bold transition-all active:scale-95" 
                        onClick={() => setSelectedPatient(p)}
                        type="button"
                      >
                        <i className="bi bi-activity"></i>
                        <span>Analyze</span>
                      </button>
                      
                      {/* 2. UPDATE POP-UP TRIGGER BUTTON */}
                      <button 
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all active:scale-95 border border-gray-100" 
                        onClick={() => openEditModal(p)}
                        type="button"
                        title="Edit Patient"
                      >
                        <i className="bi bi-pencil-square"></i>
                        <span>Edit</span>
                      </button>

                      {/* 3. DELETE POP-UP TRIGGER BUTTON */}
                      <button 
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all active:scale-95" 
                        onClick={() => {
                          setDeletePatientId(p.id);
                          setDeletePatientStudyId(p.patientStudyId || "PENDING");
                          setIsDeleteModalOpen(true);
                        }}
                        type="button"
                        title="Delete Patient"
                      >
                        <i className="bi bi-trash-fill"></i>
                        <span>Delete</span>
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

      {/* ========================================================= */}
      {/* THE UPDATING MODAL COMPONENT (Renders absolutely over document grid if true) */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border-2 border-gray-200 w-full max-w-md shadow-xl">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <i className="bi bi-pencil-square"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Modify Roster Record</h3>
                  <span className="text-xs font-mono font-bold text-violet-500">{editPatientStudyId}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                onClick={() => setIsEditModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdatePatient} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Age</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium" 
                  placeholder="Years" 
                  value={editAge} 
                  onChange={(e) => setEditAge(e.target.value)} 
                  required 
                  min="0" 
                  max="125" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Biological Gender</label>
                <select 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 mt-1 bg-white focus:border-violet-500 outline-none transition-colors text-gray-800 font-medium" 
                  value={editGender} 
                  onChange={(e) => setEditGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  className="flex-1 py-3 border-2 border-gray-100 hover:border-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updateLoading} 
                  className="flex-1 py-3 bg-violet-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-violet-100 flex justify-center items-center"
                >
                  {updateLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* THE DELETE CONFIRMATION POP-UP MODAL                      */}
      {/* ========================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 w-full max-w-sm shadow-xl text-center">
            
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xl mx-auto mb-4">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Patient Record?</h3>
            <p className="text-xs font-medium text-gray-400 mb-2">Are you sure you want to delete subject:</p>
            <div className="text-sm font-mono font-bold text-red-500 bg-red-50/50 py-1.5 px-3 rounded-xl inline-block mb-6">
              {deletePatientStudyId}
            </div>

            <div className="flex space-x-3">
              <button 
                type="button" 
                className="flex-1 py-3 border-2 border-gray-100 hover:border-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-all active:scale-95"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                No, Keep it
              </button>
              <button 
                type="button" 
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-red-100 active:scale-95"
                onClick={() => {
                  handleDeletePatient(deletePatientId);
                  setIsDeleteModalOpen(false);
                }}
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
