'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Call login function from auth hook
      const result = await login(email, password);
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to Stratix AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Unlock AI-powered ecommerce optimization
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400">
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/api/auth/google"
                className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Sign in with Google</span>
                <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.25 12.0004 19.25C8.87043 19.25 6.22043 17.14 5.27045 14.295L1.28046 17.39C3.25046 21.31 7.31044 24.0001 12.0004 24.0001Z" fill="#34A853"/>
                </svg>
                <span className="ml-2">Continue with Google</span>
              </Link>
              
              <Link
                href="/api/auth/shopify"
                className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Sign in with Shopify</span>
                <svg className="h-5 w-5" viewBox="0 0 109.5 124.5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M74.7,14.8c0-0.6,0-1.3,0-2.2c-0.1-3-1-5.6-2.5-8.2C70,1.4,66.6,0,62.8,0c-0.7,0-1.4,0.1-2.1,0.2 c-0.1,0-0.6,0.1-0.6,0.1c-0.5-0.7-1.3-1.2-2-1.8C55.8-3.1,52.7-0.9,50,0.9c-8.5,5.6-12.1,15.9-13.4,25.7c-5.5,1.7-9.4,2.9-9.4,2.9 c-2.8,0.9-2.9,0.9-3.2,3.7c-0.2,2.1-6.9,53-6.9,53l51.6,9.8l27.8-7L74.7,14.8z M62.5,10.5c-0.8,0.3-1.7,0.5-2.8,0.8 c0-1.6-0.2-3.8-0.6-6.5C61.8,5.6,62.4,8.6,62.5,10.5z M56.5,12c-1.9,0.6-3.9,1.2-6,1.9c0.6-4.5,1.9-8.9,4.3-13.2 C55.7,4.3,56.3,8.2,56.5,12z M50.1,4.2c1-2.3,2.4-4.2,4.2-5.5C57.9-3.6,61.9-0.1,65,4C58.9,6,53.3,7.9,48.1,9.7 C48.7,7.6,49.3,5.8,50.1,4.2z" fill="#95BF47"/>
                  <path d="M74.7,14.8c0-0.6,0-1.3,0-2.2c-0.1-3-1-5.6-2.5-8.2c-2.2-3-5.6-4.4-9.4-4.4c-0.7,0-1.4,0.1-2.1,0.2 c-0.1,0-0.6,0.1-0.6,0.1c-0.5-0.7-1.3-1.2-2-1.8C55.8-3.1,52.7-0.9,50,0.9c-8.5,5.6-12.1,15.9-13.4,25.7c-5.5,1.7-9.4,2.9-9.4,2.9 c-2.8,0.9-2.9,0.9-3.2,3.7c-0.2,2.1-6.9,53-6.9,53l51.6,9.8V0C65.6,0,72.2,0,74.7,14.8z M56.5,12c-1.9,0.6-3.9,1.2-6,1.9 c0.6-4.5,1.9-8.9,4.3-13.2C55.7,4.3,56.3,8.2,56.5,12z M50.1,4.2c1-2.3,2.4-4.2,4.2-5.5C57.9-3.6,61.9-0.1,65,4 C58.9,6,53.3,7.9,48.1,9.7C48.7,7.6,49.3,5.8,50.1,4.2z" fill="#5E8E3E"/>
                  <path d="M95.6,124.5V77.1l-23.1,5.6v41.9L95.6,124.5L95.6,124.5z M75.1,109.8l7.5-2.2v-7.3l-7.5,1.8V109.8z" fill="#FFFFFF"/>
                  <path d="M102.2,54.4c-2-0.8-7.2-1.3-7.2-1.3s-10-1-11.1-1.1c-1.1-0.1-2.1-0.1-3.2,0c-1.2,0.2-3.5,1-3.5,1s-2.6,0.8-3.9,1.2 c-0.3,0.1-0.6,0.2-0.9,0.3v89.1l23.1-5.6V83.6c0,0,6.3-1.7,9-2.4c2.4-0.6,5.2-1.2,5.2-4.8C109.8,69.9,107.1,56.4,102.2,54.4z" fill="#FFFFFF"/>
                </svg>
                <span className="ml-2">Connect with Shopify</span>
              </Link>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  try {
                    console.log('Demo login clicked');
                    const result = await login('demo@example.com', 'password');
                    console.log('Demo login result:', result);
                    
                    if (!result.success) {
                      throw new Error(result.error || 'Login failed');
                    }
                    
                    console.log('Demo login successful, redirecting...');
                    router.push('/dashboard');
                  } catch (err: any) {
                    console.error('Demo login error:', err);
                    setError(err.message || 'Login failed. Please try again.');
                  }
                }}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                disabled={isLoading}
              >
                Try demo account
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
