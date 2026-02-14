import { useState } from 'react'
import { checkHealth } from './api'

function App() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleHealthCheck = async () => {
    setLoading(true)
    setError(null)
    setHealthStatus(null)
    
    try {
      const data = await checkHealth()
      setHealthStatus(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Adaptive Learning Platform
            </h1>
            <p className="text-gray-600 mb-8">
              College Management & Learning System
            </p>

            <div className="space-y-6">
              <button
                onClick={handleHealthCheck}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check Backend Health'}
              </button>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {healthStatus && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 mb-2">
                        Backend Health Status
                      </h3>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Status:</strong> {healthStatus.status}</p>
                        <p><strong>Service:</strong> {healthStatus.service}</p>
                        <p><strong>Database:</strong> {healthStatus.database}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  System Information
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Frontend:</strong> React + Vite + Tailwind CSS</p>
                  <p><strong>Backend:</strong> FastAPI + PostgreSQL</p>
                  <p><strong>API URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
