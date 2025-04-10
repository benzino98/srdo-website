import React from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  delay,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="text-blue-600 mb-4 text-4xl">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const FeatureCards: React.FC = () => {
  const features = [
    {
      title: "Results Driven Solutions",
      description:
        "We implement data-driven strategies and measurable outcomes to ensure impactful and sustainable results across all initiatives.",
      icon: "📊",
      delay: 0.1,
    },
    {
      title: "Impact",
      description:
        "We focus on creating meaningful, long-lasting positive changes in MDAs through strategic interventions and evidence-based approaches.",
      icon: "🎯",
      delay: 0.2,
    },
    {
      title: "Coordination & Delivery",
      description:
        "We ensure seamless coordination between stakeholders and MDAs to ensure efficient delivery of projects through robust project management frameworks.",
      icon: "🔄",
      delay: 0.3,
    },
    {
      title: "Performance",
      description:
        "We maintain high standards of excellence through continuous monitoring, evaluation, and optimization of our strategies and implementations.",
      icon: "⭐",
      delay: 0.4,
    },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What We Do</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our approach combines strategic planning, efficient execution, and
            rigorous performance monitoring to deliver transformative results.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;
