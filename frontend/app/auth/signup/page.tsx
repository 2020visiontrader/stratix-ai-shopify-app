'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const SignupPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Account created successfully');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>
        
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
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/api/auth/google"
              className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Sign up with Google</span>
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
              <span className="sr-only">Sign up with Shopify</span>
              <svg className="h-5 w-5" viewBox="0 0 109.5 124.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M74.7,14.8c0-0.6,0-1.3,0-2.2c-0.1-3-1-5.6-2.5-8.2C70,1.4,66.6,0,62.8,0c-0.7,0-1.4,0.1-2.1,0.2 c-0.1,0-0.6,0.1-0.6,0.1c-0.5-0.7-1.3-1.2-2-1.8C55.8-3.1,52.7-0.9,50,0.9c-8.5,5.6-12.1,15.9-13.4,25.7c-5.5,1.7-9.4,2.9-9.4,2.9 c-2.8,0.9-2.9,0.9-3.2,3.7c-0.2,2.1-6.9,53-6.9,53l51.6,9.8l27.8-7L74.7,14.8z M62.5,10.5c-0.8,0.3-1.7,0.5-2.8,0.8 c0-1.6-0.2-3.8-0.6-6.5C61.8,5.6,62.4,8.6,62.5,10.5z M56.5,12c-1.9,0.6-3.9,1.2-6,1.9c0.6-4.5,1.9-8.9,4.3-13.2 C55.7,4.3,56.3,8.2,56.5,12z M50.1,4.2c1-2.3,2.4-4.2,4.2-5.5C57.9-3.6,61.9-0.1,65,4C58.9,6,53.3,7.9,48.1,9.7 C48.7,7.6,49.3,5.8,50.1,4.2z" fill="#95BF47"/>
                <path d="M74.7,14.8c0-0.6,0-1.3,0-2.2c-0.1-3-1-5.6-2.5-8.2c-2.2-3-5.6-4.4-9.4-4.4c-0.7,0-1.4,0.1-2.1,0.2 c-0.1,0-0.6,0.1-0.6,0.1c-0.5-0.7-1.3-1.2-2-1.8C55.8-3.1,52.7-0.9,50,0.9c-8.5,5.6-12.1,15.9-13.4,25.7c-5.5,1.7-9.4,2.9-9.4,2.9 c-2.8,0.9-2.9,0.9-3.2,3.7c-0.2,2.1-6.9,53-6.9,53l51.6,9.8V0C65.6,0,72.2,0,74.7,14.8z M56.5,12c-1.9,0.6-3.9,1.2-6,1.9 c0.6-4.5,1.9-8.9,4.3-13.2C55.7,4.3,56.3,8.2,56.5,12z M50.1,4.2c1-2.3,2.4-4.2,4.2-5.5C57.9-3.6,61.9-0.1,65,4 C58.9,6,53.3,7.9,48.1,9.7C48.7,7.6,49.3,5.8,50.1,4.2z" fill="#5E8E3E"/>
                <path d="M95.6,124.5V77.1l-23.1,5.6v41.9L95.6,124.5L95.6,124.5z M75.1,109.8l7.5-2.2v-7.3l-7.5,1.8V109.8z" fill="#FFFFFF"/>
                <path d="M102.2,54.4c-2-0.8-7.2-1.3-7.2-1.3s-10-1-11.1-1.1c-1.1-0.1-2.1-0.1-3.2,0c-1.2,0.2-3.5,1-3.5,1s-2.6,0.8-3.9,1.2 c-0.3,0.1-0.6,0.2-0.9,0.3v89.1l23.1-5.6V83.6c0,0,6.3-1.7,9-2.4c2.4-0.6,5.2-1.2,5.2-4.8C109.8,69.9,107.1,56.4,102.2,54.4z" fill="#FFFFFF"/>
              </svg>
              <span className="ml-2">Connect with Shopify</span>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

export default SignupPage;