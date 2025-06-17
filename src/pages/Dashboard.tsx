import { FeatureSection } from '@/components/FeatureSection';
import { FeatureToggle } from '@/components/FeatureToggle';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFeature } from '@/hooks/useFeature';
import { useNotifications } from '@/hooks/useNotifications';
import { useSecurity } from '@/hooks/useSecurity';
import { useStore } from '@/hooks/useStore';
import { Tab } from '@headlessui/react';
import {
    BellIcon,
    ChartBarIcon,
    CogIcon,
    CurrencyDollarIcon,
    GiftIcon,
    HomeIcon,
    LightBulbIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    ShoppingBagIcon,
    SparklesIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
    const [selectedTab, setSelectedTab] = useState(0);
    const { features, toggleFeature } = useFeature();
    const { analytics, trackEvent } = useAnalytics();
    const { storeData, performAction } = useStore();
    const { notifications, markAsRead } = useNotifications();
    const { securityStatus, checkSecurity } = useSecurity();

    useEffect(() => {
        // Initialize data
        trackEvent('dashboard_view');
        checkSecurity();
    }, []);

    const tabs = [
        { name: 'Overview', icon: HomeIcon },
        { name: 'Products', icon: ShoppingBagIcon },
        { name: 'Customers', icon: UserGroupIcon },
        { name: 'Analytics', icon: ChartBarIcon },
        { name: 'Settings', icon: CogIcon },
    ];

    const navigation = [
        { name: 'Home', href: '#', icon: HomeIcon, current: true },
        { name: 'Orders', href: '#', icon: ShoppingBagIcon, current: false },
        { name: 'Products', href: '#', icon: WrenchScrewdriverIcon, current: false },
        { name: 'Customers', href: '#', icon: UserGroupIcon, current: false },
        { name: 'Discounts', href: '#', icon: GiftIcon, current: false },
        { name: 'Content', href: '#', icon: LightBulbIcon, current: false },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-purple-900 text-white flex flex-col">
                <div className="flex items-center justify-center h-16 bg-purple-800">
                    <span className="text-xl font-bold">Stratix AI</span>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                    <div className="space-y-1">
                        {navigation.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className={classNames(
                                    item.current
                                        ? 'bg-purple-700 text-white'
                                        : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                                    'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                                )}
                            >
                                <item.icon
                                    className={classNames(
                                        item.current ? 'text-gold-300' : 'text-purple-300 group-hover:text-gold-300',
                                        'mr-4 flex-shrink-0 h-6 w-6'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </a>
                        ))}
                    </div>

                    <div className="pt-4 mt-4 border-t border-purple-700">
                        <p className="px-2 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                            AI FEATURES
                        </p>
                        <a href="#" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-purple-200 hover:bg-purple-700 hover:text-white">
                            <SparklesIcon className="mr-4 flex-shrink-0 h-6 w-6 text-purple-300 group-hover:text-gold-300" aria-hidden="true" />
                            Website ReBuilder
                        </a>
                        <a href="#" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-purple-200 hover:bg-purple-700 hover:text-white">
                            <WrenchScrewdriverIcon className="mr-4 flex-shrink-0 h-6 w-6 text-purple-300 group-hover:text-gold-300" aria-hidden="true" />
                            Product ReWriter
                        </a>
                        <a href="#" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-purple-200 hover:bg-purple-700 hover:text-white">
                            <CurrencyDollarIcon className="mr-4 flex-shrink-0 h-6 w-6 text-purple-300 group-hover:text-gold-300" aria-hidden="true" />
                            RePricing
                        </a>
                    </div>

                    <div className="pt-4 mt-4 border-t border-purple-700">
                        <p className="px-2 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                            SEO
                        </p>
                        <a href="#" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-purple-200 hover:bg-purple-700 hover:text-white">
                            <MagnifyingGlassIcon className="mr-4 flex-shrink-0 h-6 w-6 text-purple-300 group-hover:text-gold-300" aria-hidden="true" />
                            SEO Checklist
                        </a>
                        <a href="#" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-purple-200 hover:bg-purple-700 hover:text-white">
                            <ChartBarIcon className="mr-4 flex-shrink-0 h-6 w-6 text-purple-300 group-hover:text-gold-300" aria-hidden="true" />
                            Product SEO
                        </a>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => markAsRead()}
                                className="relative p-2 text-gray-400 hover:text-gray-500"
                            >
                                <BellIcon className="h-6 w-6" />
                                {notifications.unread > 0 && (
                                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                                )}
                            </button>
                            <button
                                onClick={() => checkSecurity()}
                                className={`p-2 ${
                                    securityStatus.isSecure ? 'text-green-500' : 'text-red-500'
                                }`}
                            >
                                <ShieldCheckIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Build Your Store with AI Section */}
                    <div className="bg-pink-100 border-l-4 border-pink-500 p-4 mb-8 rounded-lg shadow-md flex items-center">
                        <div className="flex-shrink-0">
                            <WrenchScrewdriverIcon className="h-10 w-10 text-pink-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-bold text-pink-800">Build Your Store with AI</h3>
                            <p className="mt-2 text-sm text-pink-700">
                                Transform your entire Shopify store with AI-powered redesign. Automatically update fonts, colors, structure, and content throughout your site to create a cohesive, professional look.
                            </p>
                            <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                Build My Store
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {analytics.quickStats.map((stat) => (
                            <div
                                key={stat.id}
                                className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
                            >
                                <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </div>

                    {/* Feature Toggles */}
                    <div className="mt-8">
                        <h2 className="text-lg font-medium text-gray-900">Feature Toggles</h2>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {features.toggles.map((feature) => (
                                <FeatureToggle
                                    key={feature.id}
                                    feature={feature}
                                    onToggle={(enabled) => toggleFeature(feature.id, enabled)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Main Content (Tabs) */}
                    <div className="mt-8">
                        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                            <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow">
                                {tabs.map((tab) => (
                                    <Tab
                                        key={tab.name}
                                        className={({ selected }) =>
                                            classNames(
                                                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                                'ring-white ring-opacity-60 ring-offset-2 ring-offset-purple-400 focus:outline-none focus:ring-2',
                                                selected
                                                    ? 'bg-purple-100 text-purple-700 shadow'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                            )
                                        }
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <tab.icon className="h-5 w-5" />
                                            <span>{tab.name}</span>
                                        </div>
                                    </Tab>
                                ))}
                            </Tab.List>
                            <Tab.Panels className="mt-4">
                                {/* Overview Tab */}
                                <Tab.Panel>
                                    <div className="space-y-6">
                                        <FeatureSection
                                            featureId="brandAnalysis"
                                            title="Brand Analysis"
                                            description="Analyze brand DNA and generate insights"
                                        >
                                            {/* Brand Analysis Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="storeAnalysis"
                                            title="Store Analysis"
                                            description="Analyze store performance"
                                        >
                                            {/* Store Analysis Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="storeOptimization"
                                            title="Store Optimization"
                                            description="Optimize store performance"
                                        >
                                            {/* Store Optimization Content */}
                                        </FeatureSection>
                                    </div>
                                </Tab.Panel>

                                {/* Products Tab */}
                                <Tab.Panel>
                                    <div className="space-y-6">
                                        <FeatureSection
                                            featureId="productLearning"
                                            title="Product Learning"
                                            description="Learn from product data"
                                        >
                                            {/* Product Learning Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="productOptimization"
                                            title="Product Optimization"
                                            description="Optimize product listings"
                                        >
                                            {/* Product Optimization Content */}
                                        </FeatureSection>
                                    </div>
                                </Tab.Panel>

                                {/* Customers Tab */}
                                <Tab.Panel>
                                    <div className="space-y-6">
                                        <FeatureSection
                                            featureId="customerInsights"
                                            title="Customer Insights"
                                            description="Analyze customer behavior and preferences"
                                        >
                                            {/* Customer Insights Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="customerSegmentation"
                                            title="Customer Segmentation"
                                            description="Segment customers for targeted marketing"
                                        >
                                            {/* Customer Segmentation Content */}
                                        </FeatureSection>
                                    </div>
                                </Tab.Panel>

                                {/* Analytics Tab */}
                                <Tab.Panel>
                                    <div className="space-y-6">
                                        <FeatureSection
                                            featureId="salesAnalytics"
                                            title="Sales Analytics"
                                            description="Track and analyze sales performance"
                                        >
                                            {/* Sales Analytics Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="marketingAnalytics"
                                            title="Marketing Analytics"
                                            description="Measure marketing campaign effectiveness"
                                        >
                                            {/* Marketing Analytics Content */}
                                        </FeatureSection>
                                    </div>
                                </Tab.Panel>

                                {/* Settings Tab */}
                                <Tab.Panel>
                                    <div className="space-y-6">
                                        <FeatureSection
                                            featureId="generalSettings"
                                            title="General Settings"
                                            description="Configure general application settings"
                                        >
                                            {/* General Settings Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="integrationSettings"
                                            title="Integration Settings"
                                            description="Manage third-party integrations"
                                        >
                                            {/* Integration Settings Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="notificationSettings"
                                            title="Notification Settings"
                                            description="Configure notification preferences"
                                        >
                                            {/* Notification Settings Content */}
                                        </FeatureSection>
                                        <FeatureSection
                                            featureId="securitySettings"
                                            title="Security Settings"
                                            description="Manage security preferences"
                                        >
                                            {/* Security Settings Content */}
                                        </FeatureSection>
                                    </div>
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                </main>
            </div>
        </div>
    );
}
