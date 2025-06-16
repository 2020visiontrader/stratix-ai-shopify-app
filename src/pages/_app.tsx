import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import { Provider as PolarisProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FeatureProvider } from '../components/FeatureProvider';
import { productionConfig } from '../config/production';
import '../styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
});

function MyApp({ Component, pageProps }: AppProps) {
  const shopifyConfig = {
    apiKey: productionConfig.shopify.apiKey!,
    host: productionConfig.shopify.hostName!,
    forceRedirect: true
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppBridgeProvider config={shopifyConfig}>
          <PolarisProvider>
            <FeatureProvider>
              <Component {...pageProps} />
            </FeatureProvider>
          </PolarisProvider>
        </AppBridgeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default MyApp; 