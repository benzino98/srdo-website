import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsCash } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import {
  BuildingOffice2Icon,
  ScaleIcon,
  CpuChipIcon,
  GlobeAsiaAustraliaIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  DocumentCheckIcon,
  HeartIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface PriorityCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  items?: string[];
  className?: string;
  onClick?: () => void;
}

const PriorityCard: React.FC<PriorityCardProps> = ({
  title,
  description,
  icon,
  items,
  className,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-4 sm:p-6 rounded-lg shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer ${className}`}
    >
      {icon && (
        <div className="mb-4">
          <div className="w-12 h-12 text-primary-600">{icon}</div>
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-primary-600">
        {title}
      </h3>
      {items && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2"
            >
              <span className="w-2 h-2 bg-secondary-500 rounded-full" />
              <span className="text-sm sm:text-base">{item}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}> = ({ isOpen, onClose, title, description, icon }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 top-[5%] md:top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-2xl bg-white rounded-lg shadow-xl z-50 p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center space-x-4 mb-6">
              {icon && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 text-primary-600"
                >
                  {icon}
                </motion.div>
              )}
              <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
            </div>
            <div className="prose max-w-none">
              {description.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4 text-sm sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const GovernorPriorities: React.FC = () => {
  const [selectedPriority, setSelectedPriority] = useState<{
    title: string;
    description: string;
    icon?: React.ReactNode;
  } | null>(null);
  const navigate = useNavigate();

  const mainPriorities = [
    {
      title: "Economic Rebirth",
      description: "Driving economic growth and revenue generation",
      icon: <BanknotesIcon className="w-full h-full" />,
      className: "border-l-4 border-blue-500",
      onClick: () => navigate("/priorities/economic-rebirth"),
    },
    {
      title: "Physical Infrastructure Development",
      description:
        "Infrastructure development is at the heart of our transformation agenda. We are focusing on developing world-class infrastructure that will support economic growth and improve quality of life.\n\nOur comprehensive infrastructure plan includes road network expansion, water supply systems, energy infrastructure, and modern public facilities.\n\nWe are committed to sustainable and climate-resilient infrastructure that will serve generations to come.",
      className: "border-l-4 border-green-500",
      icon: <BuildingOffice2Icon />,
      onClick: () => navigate("/priorities/physical-infrastructure"),
    },
    {
      title: "Peace, Security and Good Governance",
      description:
        "Maintaining peace, ensuring security, and promoting good governance are fundamental to our development agenda.\n\nWe are implementing comprehensive security measures while fostering community engagement and dialogue.\n\nOur governance framework emphasizes transparency, accountability, and citizen participation in decision-making processes.",
      className: "border-l-4 border-purple-500",
      icon: <ScaleIcon />,
      onClick: () => navigate("/priorities/peace-security"),
    },
  ];

  const thematicAreas = [
    {
      title: "AGRICULTURE",
      description:
        "Our agricultural transformation program focuses on modernizing farming practices, introducing climate-smart agriculture, and establishing value addition facilities. We aim to ensure food security while creating sustainable livelihoods for our farmers.",
      icon: <GlobeAsiaAustraliaIcon />,
    },
    {
      title: "MINING",
      description:
        "We are developing a responsible mining sector that benefits local communities while ensuring environmental sustainability. Our focus is on proper regulation, local content development, and value addition in the mining sector.",
      icon: <BuildingLibraryIcon />,
    },
    {
      title: "INDUSTRY, TOURISM, TRADE & INVESTMENT",
      description:
        "Industrial development and tourism are key to our economic transformation. We are establishing industrial parks, promoting SMEs, and creating an enabling environment for manufacturing and processing industries. Our strategy includes developing tourist attractions, improving business environment, and facilitating trade relationships.",
      icon: <BriefcaseIcon />,
    },
    {
      title: "FUNDING & RESOURCE MOBILIZATION",
      description:
        "Our innovative resource mobilization strategy includes public-private partnerships, efficient revenue collection, and strategic partnerships with development partners to fund our development agenda.",
      icon: <BanknotesIcon />,
    },
    {
      title: "PHYSICAL INFRASTRUCTURE",
      description:
        "We are investing in critical infrastructure including roads, water systems, energy, and public facilities to support economic growth and improve living standards.",
      icon: <BuildingOfficeIcon />,
    },
    {
      title: "INSTITUTIONAL, LEGAL & SECTOR REFORMS",
      description:
        "Comprehensive reforms are being implemented to streamline government operations, improve service delivery, and create an enabling environment for development.",
      icon: <DocumentCheckIcon />,
    },
    {
      title: "HEALTH",
      description:
        "Our health sector strategy focuses on improving healthcare access, upgrading medical facilities, and strengthening preventive healthcare services to ensure a healthy population.",
      icon: <HeartIcon />,
    },
    {
      title: "EDUCATION",
      description:
        "We are revolutionizing education through infrastructure development, curriculum enhancement, and teacher training to prepare our youth for the future job market.",
      icon: <AcademicCapIcon />,
    },
    {
      title: "YOUTH, WOMEN & SOCIAL DEVELOPMENT",
      description:
        "Empowering youth and women is central to our development agenda. We are implementing programs for skills development, economic empowerment, and social inclusion.",
      icon: <UserGroupIcon />,
    },
    {
      title: "ICT DEVELOPMENT",
      description:
        "Our digital transformation strategy aims to leverage technology for improved service delivery, digital literacy, and creation of opportunities in the digital economy.",
      icon: <CpuChipIcon />,
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[40vh] sm:h-[60vh] flex items-center justify-center overflow-hidden bg-black">
        {/* Image as actual element for better control */}
        <img
          src="/images/backgrounds/heroBackground.jpg"
          alt="Governor's Background"
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50" />
        <div className="relative z-10 text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Governor's Vision & Priorities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto"
          >
            Building a prosperous future through strategic development and
            inclusive governance
          </motion.p>
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mb-8 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
              Key Priority Areas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {mainPriorities.map((priority, index) => (
                <PriorityCard
                  key={index}
                  title={priority.title}
                  description={priority.description}
                  icon={priority.icon}
                  className={priority.className}
                  onClick={priority.onClick}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
              Thematic Areas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {thematicAreas.map((area, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedPriority(area)}
                  className="p-4 sm:p-6 rounded-lg shadow-lg bg-white hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 text-primary-600">{area.icon}</div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                      {area.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!selectedPriority}
        onClose={() => setSelectedPriority(null)}
        title={selectedPriority?.title || ""}
        description={selectedPriority?.description || ""}
        icon={selectedPriority?.icon}
      />
    </div>
  );
};

export default GovernorPriorities;
