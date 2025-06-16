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
    HomeIcon,
    ShieldCheckIcon,
    ShoppingBagIcon,
    UserGroupIcon
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

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
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

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

                {/* Main Content */}
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
    );
} 