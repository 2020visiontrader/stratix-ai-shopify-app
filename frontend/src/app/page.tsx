import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
              Stratix AI
            </span>
            <br />
            E-commerce Optimization Platform
          </h1>
          <p className="text-xl text-purple-200 mb-12 max-w-3xl mx-auto">
            Transform your e-commerce business with AI-powered optimization. 
            Access 75+ enterprise features designed to boost your sales and streamline operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="btn-primary"
            >
              Get Started
            </Link>
            <Link 
              href="/features" 
              className="btn-secondary"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-purple-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Analytics',
                description: 'Get deep insights into your business performance with advanced AI algorithms.'
              },
              {
                title: 'Inventory Optimization',
                description: 'Smart inventory management to reduce costs and improve efficiency.'
              },
              {
                title: 'Customer Insights',
                description: 'Understand your customers better with detailed behavioral analytics.'
              }
            ].map((feature, index) => (
              <div key={index} className="card">
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-purple-200">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 