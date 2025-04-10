import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronRightIcon,
  ArrowLeftIcon,
  BuildingLibraryIcon,
  ScaleIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface MDACategory {
  title: string;
  organizations: string[];
  icon: React.ReactNode;
}

const PeaceSecurity: React.FC = () => {
  const mdaCategories: MDACategory[] = [
    {
      title: "Governance & Administration",
      icon: <BuildingLibraryIcon className="w-full h-full" />,
      organizations: [
        "Office of the Executive Governor",
        "Office of the Deputy Governor",
        "State House of Assembly",
        "State House of Assembly Commission",
        "Office of the Secretary to the State Government",
        "Office of the Head of Civil Service",
      ],
    },
    {
      title: "Law & Security",
      icon: <ScaleIcon className="w-full h-full" />,
      organizations: [
        "Ministry of Justice",
        "Plateau State Peace Building Agency",
        "Plateau State Boundary Commission",
        "Plateau State Emergency Relief and Management Agency",
        "Plateau State Operation Rainbow",
        "Plateau State Fire Service Directorate",
        "Plateau State Judicial Service Commission",
        "Plateau State High Court of Justice",
        "Plateau State Customary Court of Appeal",
        "Plateau State Sharia Court of Appeal",
        "Multi-Door Court House",
      ],
    },
    {
      title: "Public Administration & Local Government",
      icon: <UserGroupIcon className="w-full h-full" />,
      organizations: [
        "Ministry for Local Government and Chieftain Affairs",
        "Plateau State Civil Service Commission",
        "Plateau State Local Government Service Commission",
        "Plateau State Local Government Audit Department",
      ],
    },
    {
      title: "Regulatory & Social Services",
      icon: <ShieldCheckIcon className="w-full h-full" />,
      organizations: [
        "Plateau State Christian Pilgrims Welfare Board",
        "Plateau State Muslim Pilgrims Welfare Board",
        "Plateau State Independence Electoral Commission",
        "Plateau State Disability Rights Commission",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/images/backgrounds/heroBackground.jpg")',
          }}
        >
          <div className="absolute inset-0 bg-black/50" /> {/* Dark overlay */}
        </div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative py-24 md:py-32"
        >
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Link
                to="/priorities"
                className="inline-flex items-center text-white hover:text-green-200 transition-colors group"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                <span className="text-lg">Back to Governor's Priorities</span>
              </Link>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold mb-6 text-white"
            >
              Peace, Security and Good Governance
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-100 max-w-3xl font-light"
            >
              Fostering peace, ensuring security, and promoting transparent
              governance for a stable and prosperous Plateau State
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mdaCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-green-600 hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-[#107912] to-green-700 px-6 py-4 flex items-center space-x-4">
                <div className="w-10 h-10 text-white">{category.icon}</div>
                <h2 className="text-xl font-semibold text-white">
                  {category.title}
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {category.organizations.map((org, orgIndex) => (
                    <motion.li
                      key={orgIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + orgIndex * 0.1 }}
                      className="flex items-start space-x-2 group"
                    >
                      <ChevronRightIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                      <span className="text-gray-700 group-hover:text-green-700 transition-colors">
                        {org}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-green-50 rounded-xl p-8 shadow-lg border border-green-100"
        >
          <h2 className="text-2xl font-bold text-[#107912] mb-4">
            Our Commitment to Good Governance
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            Through coordinated efforts across these MDAs, we are committed to
            maintaining peace, ensuring security, and promoting good governance
            in Plateau State. Our comprehensive approach encompasses law
            enforcement, judicial systems, local governance, and social services
            to create a stable and prosperous environment for all citizens.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md border border-green-100"
            >
              <h3 className="text-lg font-semibold text-[#107912] mb-2">
                Peace Building
              </h3>
              <p className="text-gray-600">
                Fostering community dialogue and implementing comprehensive
                peace-building initiatives
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white p-6 rounded-lg shadow-md border border-green-100"
            >
              <h3 className="text-lg font-semibold text-[#107912] mb-2">
                Security Enhancement
              </h3>
              <p className="text-gray-600">
                Strengthening security measures and emergency response
                capabilities
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white p-6 rounded-lg shadow-md border border-green-100"
            >
              <h3 className="text-lg font-semibold text-[#107912] mb-2">
                Transparent Governance
              </h3>
              <p className="text-gray-600">
                Ensuring accountability and citizen participation in governance
                processes
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PeaceSecurity;
