'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ShopifyAuth() {
  const [shopDomain, setShopDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain) {
      toast.error('Please enter your Shopify store domain');
      return;
    }
    
    // Format the shop domain if needed
    let formattedDomain = shopDomain.trim().toLowerCase();
    
    // Remove https:// or http:// if present
    formattedDomain = formattedDomain.replace(/^https?:\/\//, '');
    
    // Remove trailing slash if present
    formattedDomain = formattedDomain.replace(/\/$/, '');
    
    // Add .myshopify.com if not present and doesn't contain a dot
    if (!formattedDomain.includes('.')) {
      formattedDomain = `${formattedDomain}.myshopify.com`;
    }
    
    setIsLoading(true);
    
    try {
      // Redirect to Shopify OAuth flow
      const response = await fetch(`/api/shopify?shop=${formattedDomain}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect to Shopify');
      }
      
      // Redirect to Shopify auth URL
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect to Shopify');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Connect Your Shopify Store
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Stratix AI helps you optimize your Shopify store with AI-powered insights and automations.
          </p>
        </div>
        
        <div className="mt-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">How it works:</h2>
              <ul className="mt-4 space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-sm mr-3">
                    1
                  </div>
                  <span>Enter your Shopify store domain below</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-sm mr-3">
                    2
                  </div>
                  <span>Authorize Stratix AI in your Shopify admin</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-sm mr-3">
                    3
                  </div>
                  <span>We'll sync your store data and set up your account</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-sm mr-3">
                    4
                  </div>
                  <span>Start using AI-powered tools to grow your business</span>
                </li>
              </ul>
            </div>
            
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Shopify Store Domain
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="shopDomain"
                    id="shopDomain"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="yourstore.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Example: mystore.myshopify.com or mystore
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Connect Shopify Store'}
              </button>
            </form>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Sign in
                </Link>
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Want to try a demo first?{' '}
                <Link href="/auth/login?demo=true" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Use demo account
                </Link>
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Not a Shopify merchant?{' '}
                <Link href="/" as="/" className="text-blue-600 hover:text-blue-500 dark:text-blue-400" onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/');
                  window.dispatchEvent(new Event('popstate'));
                  return false;
                }}>
                  Back to home page
                </Link>
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/auth/help" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Learn more about authentication options
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
