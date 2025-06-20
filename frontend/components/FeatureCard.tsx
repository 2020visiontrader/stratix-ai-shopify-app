import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  locked?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, href, locked }) => (
  <div className={`rounded-lg p-6 bg-surface shadow-md ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary transition'}`}>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="mb-4 text-surface">{description}</p>
    <a href={locked ? undefined : href} className={`px-4 py-2 rounded bg-primary text-black ${locked ? 'pointer-events-none' : ''}`}>{locked ? 'Locked' : 'Open'}</a>
  </div>
);

// ... existing code for rendering cards ...

// Example usage in dashboard:
// const user = ... // get user from context or props
// <FeatureCard
//   title="Theme Builder"
//   description="AI-powered Shopify theme and layout builder."
//   href="/dashboard/theme-builder"
//   locked={!user.plan?.includes('theme-builder')}
// />

export default FeatureCard; 