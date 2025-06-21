'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setIsSubmitted(true);
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Forgot your password?
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSubmitted 
              ? 'Check your email for a reset link'
              : 'Enter your email and we will send you a reset link'}
          </p>
        </div>
        
        {!isSubmitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your email inbox and follow the instructions.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or 
              <button 
                onClick={() => setIsSubmitted(false)}
                className="ml-1 text-purple-600 hover:text-purple-500 dark:text-purple-400"
              >
                try again
              </button>
            </p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/auth/login" 
            className="text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}