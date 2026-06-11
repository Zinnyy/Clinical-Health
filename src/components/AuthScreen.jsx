import React, { useState } from 'react';

export default function AuthScreen({ onLoginSuccess }) {
  // 1. These states manage switching between the Login and Register view
  const [isLoginView, setIsLoginView] = useState(true);
  
  // 2. These states hold whatever the user types into the input fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  
  // 3. These states control system alerts, loading spinners, and errors
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // !!! IMPORTANT: Change this URL string to match your running C# backend port !!!
  const API_BASE = "https://health-information.onrender.com"; 

  // 4. This function triggers when the user clicks the "submit" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stops the browser from refreshing the entire page
    setMessage('');
    setLoading(true);

    // Pick the endpoint and payload based on what form is currently visible
   let endpoint = isLoginView 
  ? (username.toLowerCase() === 'zinny' ? '/api/Admin/login' : '/api/User/login') 
  : '/api/User/register';
    
    const payload = isLoginView 
      ? { Username: username, Password: password }
      : { Username: username, Email: email, Password: password, FullName: fullName };

       try{

      // Send the data over to your ASP.NET Core API using the fixed endpoint
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && (data.isSuccess || !isLoginView || data.token)) {
        setIsError(false);
        if (isLoginView) {
          setMessage('Access granted! Authenticating...');
          
          // Save your variables securely into browser storage
          localStorage.setItem('jwtToken', data.token); 
          localStorage.setItem('currentUserId', data.userId || data.id || "1"); 
  
          // 2. FORCE ADMIN FLAG: Save the exact role claim string locally
          if (username.toLowerCase() === 'zinny') {
            localStorage.setItem('userRole', 'Admin');
          } else {
            localStorage.setItem('userRole', 'Operator');
          }

          // Wait 1.2 seconds so the user sees the success message, then open dashboard
          setTimeout(() => onLoginSuccess(), 1200);
        } else {
          setMessage('Account created successfully! Please log in.');
          setIsLoginView(true); 
          setLoading(false);
          setUsername('');
          setFullName('');
          setEmail('');
          setPassword('');
        }
      } else {
        setIsError(true);
        setMessage(data.message || 'An error occurred during authentication.');
        setLoading(false);
      }
    } catch (err) {
      setIsError(true);
      setMessage('Cannot connect to C# backend. Verify your API server is running.');
      setLoading(false);
    }

  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      {/* LEFT COLUMN: Clean Data Entry Terminal */}
      <div className="w-full flex items-center justify-center lg:w-1/2 px-4">
        <div className="bg-white px-10 py-12 rounded-3xl border-2 border-gray-200 w-full max-w-md shadow-sm">
          
          <h1 className="text-4xl font-semibold text-gray-900">
            {isLoginView ? 'Welcome Back' : 'Register Operator'}
          </h1>
          <p className="font-medium text-base text-gray-500 mt-2 mb-6">
            {isLoginView ? 'Welcome back! Please enter your details' : 'Initialize a new system operator profile'}
          </p>

          {/* Alert Status Banner */}
          {message && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium text-center ${isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <>
                <div>
                  <label className="text-base font-medium text-gray-700">Full Name</label>
                  <input type="text" className="w-full border-2 border-gray-100 rounded-xl p-3.5 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors" placeholder="e.g. Dr. Alex Mercer" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-base font-medium text-gray-700">Email Address</label>
                  <input type="email" className="w-full border-2 border-gray-100 rounded-xl p-3.5 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors" placeholder="name@institution.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </>
            )}

            <div>
              <label className="text-base font-medium text-gray-700">Username</label>
              <input type="text" className="w-full border-2 border-gray-100 rounded-xl p-3.5 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div>
              <label className="text-base font-medium text-gray-700">Password</label>
              <input type="password" className="w-full border-2 border-gray-100 rounded-xl p-3.5 mt-1 bg-transparent focus:border-violet-500 outline-none transition-colors" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {isLoginView && (
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300" />
                  <label className="ml-2 font-medium text-sm text-gray-600" htmlFor="remember">Remember for 30 days</label>
                </div>
                <button type="button" className="font-medium text-sm text-violet-500 hover:text-violet-600">Forgot password</button>
              </div>
            )}

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3.5 rounded-xl bg-violet-500 text-white text-lg font-bold flex justify-center items-center shadow-md shadow-violet-200">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isLoginView ? 'Sign in' : 'Create Account'
                )}
              </button>
            </div>

            <div className="mt-6 flex justify-center items-center text-sm font-medium">
              <p className="text-gray-500">
                {isLoginView ? "Don't have an account?" : "Already registered?"}
              </p>
              <button type="button" className="text-violet-500 hover:text-violet-600 ml-2 font-semibold" onClick={() => { setIsLoginView(!isLoginView); setMessage(''); }}>
                {isLoginView ? 'Sign up' : 'Sign in'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Premium Animated Orb Graphics Backdrop */}
      <div className="hidden relative lg:flex h-full w-1/2 items-center justify-center bg-gray-100 overflow-hidden">
        {/* Bouncing Gradient Orb */}
        <div className="w-72 h-72 bg-gradient-to-tr from-violet-500 to-pink-500 rounded-full animate-bounce filter blur-sm shadow-xl" style={{ animationDuration: '3s' }} />
        {/* Soft Glassmorphism Overlay Sheet */}
        <div className="w-full h-1/2 absolute bottom-0 bg-white/20 backdrop-blur-md border-t border-white/30" />
      </div>
    </div>
    
  );
}