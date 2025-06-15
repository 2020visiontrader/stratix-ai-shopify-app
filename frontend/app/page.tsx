'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    // Test API connection
    fetch('/api')
      .then(res => res.json())
      .then(data => {
        setServerInfo(data);
        setApiStatus('connected');
      })
      .catch(() => {
        setApiStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl"
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center px-8 py-6 border-b border-gray-100/50"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Stratix AI
              </h1>
              <p className="text-sm text-gray-500">E-commerce Intelligence</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠', desc: 'Dashboard home' },
              { id: 'analytics', label: 'Analytics', icon: '📊', desc: 'Performance insights' },
              { id: 'campaigns', label: 'Campaigns', icon: '🚀', desc: 'Ad management' },
              { id: 'settings', label: 'Settings', icon: '⚙️', desc: 'Configuration' }
            ].map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                onClick={() => setActiveSection(item.id)}
                className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center px-4 py-4">
                  <span className="text-2xl mr-4">{item.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{item.label}</div>
                    <div className={`text-xs ${activeSection === item.id ? 'text-purple-100' : 'text-gray-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl"
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          {/* Status & User */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="px-6 py-6 border-t border-gray-100/50 space-y-4"
          >
            {/* API Status */}
            <div className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              apiStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              apiStatus === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  apiStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                  apiStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                }`}></div>
                {apiStatus === 'connected' ? 'System Online' :
                 apiStatus === 'error' ? 'Connection Error' :
                 'Connecting...'}
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center px-4 py-3 bg-gray-50/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">P</span>
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900 text-sm">Peter</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="ml-72 min-h-screen">
        <div className="relative">
          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-8 py-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeSection === 'overview' && 'Dashboard Overview'}
                  {activeSection === 'analytics' && 'Performance Analytics'}
                  {activeSection === 'campaigns' && 'Campaign Generator'}
                  {activeSection === 'settings' && 'Settings'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {activeSection === 'overview' && 'Welcome back, Peter. Here\'s what\'s happening with your store.'}
                  {activeSection === 'analytics' && 'Track your performance and optimize with AI insights.'}
                  {activeSection === 'campaigns' && 'Create and manage high-converting campaigns.'}
                  {activeSection === 'settings' && 'Configure your platform preferences.'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                >
                  ✨ Generate
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Content Area */}
          <div className="px-8 py-8">
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && <DashboardOverview serverInfo={serverInfo} />}
              {activeSection === 'analytics' && <AnalyticsSection />}
              {activeSection === 'campaigns' && <CampaignsSection />}
              {activeSection === 'settings' && <SettingsSection />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview({ serverInfo }: { serverInfo: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Revenue',
            value: '$127.5K',
            change: '+22%',
            trend: 'up',
            icon: '💰',
            color: 'from-emerald-500 to-teal-600'
          },
          {
            title: 'Conversion Rate',
            value: '3.24%',
            change: '+0.8%',
            trend: 'up',
            icon: '📈',
            color: 'from-blue-500 to-cyan-600'
          },
          {
            title: 'Active Tests',
            value: '8',
            change: '2 completing',
            trend: 'neutral',
            icon: '🧪',
            color: 'from-purple-500 to-violet-600'
          },
          {
            title: 'AI Optimizations',
            value: '156',
            change: 'This month',
            trend: 'up',
            icon: '🤖',
            color: 'from-orange-500 to-red-600'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{metric.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                  <p className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-emerald-600' :
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {metric.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${metric.color} flex items-center justify-center text-2xl shadow-lg`}>
                  {metric.icon}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">🧠 AI Insights</h3>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                Live
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  insight: "Shorter CTAs performed 12% better",
                  impact: "High",
                  time: "2 min ago",
                  type: "optimization"
                },
                {
                  insight: "Mobile checkout flow optimized",
                  impact: "Medium",
                  time: "15 min ago",
                  type: "improvement"
                },
                {
                  insight: "A/B test reached significance",
                  impact: "High",
                  time: "1 hour ago",
                  type: "result"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-white/50 hover:from-gray-50 hover:to-white transition-all"
                >
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    item.type === 'optimization' ? 'bg-emerald-500' :
                    item.type === 'improvement' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.insight}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.impact === 'High' ? 'bg-red-100 text-red-700' :
                        item.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.impact} Impact
                      </span>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-6"
        >
          {/* System Status */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ System Status</h3>
            <div className="space-y-3">
              {[
                { label: "API Server", status: "Online", color: "emerald" },
                { label: "AI Engine", status: "Active", color: "emerald" },
                { label: "Database", status: "Connected", color: "emerald" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 bg-${item.color}-500 rounded-full mr-2`}></div>
                    <span className={`text-sm font-medium text-${item.color}-600`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
            {serverInfo && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Version: {serverInfo.data?.version || '1.0.0'}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 Quick Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Generate Campaign
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                View Analytics
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Run A/B Test
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Aunt Mel Assistant */}
      <AuntMelAssistant />
    </motion.div>
  );
}

// UI Components
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = variant === "outline"
    ? "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Aunt Mel AI Assistant Component
function AuntMelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'mel', text: "Hi there! I'm Aunt Mel, your AI optimization assistant. Need help improving your campaigns today? 🚀" }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { from: 'user', text: inputValue }]);
      setInputValue('');

      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          from: 'mel',
          text: "I'd be happy to help! Based on your current metrics, I recommend focusing on your mobile checkout flow optimization. Would you like me to analyze your conversion funnel?"
        }]);
      }, 1000);
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 500, damping: 30 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all z-50 flex items-center justify-center"
      >
        <span className="text-2xl">🤖</span>
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 right-0 w-full sm:w-[400px] h-[70vh] bg-white/90 backdrop-blur-xl border-l border-gray-200 shadow-2xl z-50 flex flex-col rounded-tl-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-lg">🤖</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Aunt Mel</h3>
                      <p className="text-sm text-gray-500">AI Optimization Assistant</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="text-gray-600">✕</span>
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.from === 'user'
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200/50 bg-white/50">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about optimization..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Analytics Section Component
function AnalyticsSection() {
  // Sample data for charts
  const conversionData = [
    { name: 'Week 1', conversions: 3.1 },
    { name: 'Week 2', conversions: 3.4 },
    { name: 'Week 3', conversions: 3.2 },
    { name: 'Week 4', conversions: 3.7 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-gray-500 mt-1">Track campaign results and AI-led improvements.</p>
        </div>
        <span className="w-6 h-6 text-blue-600">✨</span>
      </div>

      {/* Conversion Trend Graph */}
      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-medium mb-2">Conversion Rate Over Time</h2>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            {/* Simple Chart Visualization */}
            <div className="h-full flex items-end justify-between space-x-4">
              {conversionData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-blue-500 rounded-t-md w-full transition-all duration-500 hover:bg-blue-600"
                    style={{ height: `${(item.conversions / 4) * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">{item.name}</span>
                  <span className="text-xs font-medium text-gray-800">{item.conversions}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 mb-1">Total Visitors</p>
            <h2 className="text-2xl font-semibold">18,432</h2>
            <p className="text-green-600 text-sm mt-1">+12% this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 mb-1">Optimized Products</p>
            <h2 className="text-2xl font-semibold">56</h2>
            <p className="text-blue-600 text-sm mt-1">8 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 mb-1">Active A/B Tests</p>
            <h2 className="text-2xl font-semibold">6</h2>
            <p className="text-purple-600 text-sm mt-1">2 completing</p>
          </CardContent>
        </Card>
      </div>

      {/* What's Working vs What Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* What's Working */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">What's Working</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Product Page CTAs</span>
                <span className="text-sm font-medium text-green-800">+24% CTR</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Email Campaigns</span>
                <span className="text-sm font-medium text-green-800">+18% Open Rate</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Mobile Checkout</span>
                <span className="text-sm font-medium text-green-800">+15% Conversion</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Needs Attention */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">!</span>
              </div>
              <h3 className="text-lg font-semibold text-orange-800">Needs Attention</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-700">Cart Abandonment</span>
                <span className="text-sm font-medium text-orange-800">68% Rate</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-700">Page Load Speed</span>
                <span className="text-sm font-medium text-orange-800">3.2s Average</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-700">Social Media ROI</span>
                <span className="text-sm font-medium text-orange-800">-5% This Month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-gray-500">Real-time</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { action: "New conversion on Product Page A", time: "2 min ago", type: "success" },
              { action: "A/B test reached significance", time: "5 min ago", type: "info" },
              { action: "High cart abandonment detected", time: "8 min ago", type: "warning" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'info' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm text-gray-700">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Campaigns Section Component
function CampaignsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Generator</h1>
          <p className="text-gray-500 mt-1">
            Build high-converting campaigns with Stratix AI guidance.
          </p>
        </div>
        <Button>
          <span className="w-4 h-4 mr-2">✨</span>
          Launch Campaign
        </Button>
      </div>

      {/* Campaign Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 mb-1">Upcoming Campaigns</p>
            <h2 className="text-2xl font-semibold">2</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 mb-1">Completed Campaigns</p>
            <h2 className="text-2xl font-semibold">14</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500 mb-1">Active Tests Running</p>
            <h2 className="text-2xl font-semibold">3</h2>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Panel */}
      <div className="mt-6">
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-gray-500 mb-2">
              ✨ Coming Soon
            </p>
            <p className="text-lg font-medium">
              AI-powered campaign wizard to plan, generate, and deploy ads in minutes.
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// Settings Section Component
function SettingsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Plan & Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">💎 Current Plan</h2>
            <p className="text-gray-600">Manage your subscription and usage</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">$799</div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">50,000</div>
            <div className="text-sm text-gray-600">AI Tokens/month</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">34,000 used</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">15GB</div>
            <div className="text-sm text-gray-600">Storage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">6.8GB used</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">3</div>
            <div className="text-sm text-gray-600">Connected Stores</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">All slots used</div>
          </div>
        </div>

        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Upgrade Plan
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            Download Invoices
          </motion.button>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Preferences</h2>
        <div className="space-y-6">
          {[
            {
              title: "Enable Autopilot Optimizations",
              description: "Let AI automatically optimize your campaigns",
              enabled: true
            },
            {
              title: "Weekly AI Summary Emails",
              description: "Receive weekly performance summaries",
              enabled: false
            },
            {
              title: "Real-time Notifications",
              description: "Get notified of important changes instantly",
              enabled: true
            },
            {
              title: "Advanced Analytics",
              description: "Enable detailed performance tracking",
              enabled: true
            }
          ].map((pref, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">{pref.title}</div>
                <div className="text-sm text-gray-500">{pref.description}</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  defaultChecked={pref.enabled}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${
                  pref.enabled ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    pref.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="Peter Johnson"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue="peter@company.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              type="text"
              defaultValue="E-commerce Co."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>Pacific Time (PT)</option>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Save Changes
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
