import { Tab } from '@headlessui/react';
import { BeakerIcon, ChartBarIcon, LightningBoltIcon } from '@heroicons/react/outline';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  {
    name: 'Performance',
    icon: ChartBarIcon,
    description: 'Track your brand metrics and KPIs'
  },
  {
    name: 'A/B Tests',
    icon: BeakerIcon,
    description: 'View your test results and insights'
  },
  {
    name: 'Variant Logs',
    icon: LightningBoltIcon,
    description: 'Review content variations and their performance'
  }
];

const Insights: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Insights & Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your brand's performance and learn from A/B test results.
        </p>

        <div className="mt-6">
          <Tab.Group onChange={setSelectedTab}>
            <Tab.List className="flex space-x-4 rounded-xl bg-white p-1 shadow">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }: { selected: boolean }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-indigo-50 text-indigo-700 shadow'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
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
            <Tab.Panels className="mt-6">
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2'
                )}
              >
                <h2 className="text-lg font-medium text-gray-900">Performance Metrics</h2>
                {/* Performance content will be added here */}
              </Tab.Panel>
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2'
                )}
              >
                <h2 className="text-lg font-medium text-gray-900">A/B Test Results</h2>
                {/* A/B test content will be added here */}
              </Tab.Panel>
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2'
                )}
              >
                <h2 className="text-lg font-medium text-gray-900">Content Variants</h2>
                {/* Variant logs content will be added here */}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </motion.div>
  );
};


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  {
    name: 'Performance',
    icon: ChartBarIcon,
    description: 'Track your brand metrics and KPIs'
  },
  {
    name: 'A/B Tests',
    icon: BeakerIcon,
    description: 'View your test results and insights'
  },
  {
    name: 'Variant Logs',
    icon: LightningBoltIcon,
    description: 'Review content variations and their performance'
  }
];

const Insights: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Insights & Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your brand's performance and learn from A/B test results.
        </p>

        <div className="mt-6">
          <Tab.Group onChange={setSelectedTab}>
            <Tab.List className="flex space-x-4 rounded-xl bg-white p-1 shadow">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-indigo-50 text-indigo-700 shadow'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
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
            <Tab.Panels className="mt-6">
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2'
                )}
              >
                <h2 className="text-lg font-medium text-gray-900">Performance Metrics</h2>
                {/* Performance content will be added here */}
              </Tab.Panel>
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2'
                )}
              >
                <h2 className="text-lg font-medium text-gray-900">A/B Test Results</h2>
                {/* A/B test content will be added here */}
              </Tab.Panel>
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2'
                )}
              >
                <h2 className="text-lg font-medium text-gray-900">Content Variants</h2>
                {/* Variant logs content will be added here */}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </motion.div>
  );
};

export default Insights; 