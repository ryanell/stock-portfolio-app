import { useState } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setMessage({
                    type: 'success',
                    text: 'Check your email for the confirmation link!'
                })
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                setMessage({ type: 'success', text: 'Successfully logged in!' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleOAuth = async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider, // 'google', 'facebook', 'microsoft', etc.
        })
        if (error) console.error(error)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>

                {message.text && (
                    <div className={`mb-4 p-3 rounded ${message.type === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setMessage({ type: '', text: '' })
                        }}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                        {isSignUp
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Sign up"}
                    </button>
                    <button onClick={() => handleOAuth('google')}>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    )
}

