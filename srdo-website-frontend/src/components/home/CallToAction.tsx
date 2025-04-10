import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CallToAction: React.FC = () => {
  return (
    <div className="py-16 bg-green-800 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Join Us in Shaping a Brighter Tomorrow — So That Plateau May Truly
            Shine
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl mb-8 text-green-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Play your part in building a more prosperous, inclusive, and vibrant
            Plateau State.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              to="/contact"
              className="bg-white text-green-800 hover:bg-green-100 transition-colors font-semibold px-6 py-3 rounded-lg shadow-md"
            >
              Connect with Us
            </Link>
            <Link
              to="/resources"
              className="bg-transparent hover:bg-green-700 transition-colors border-2 border-white font-semibold px-6 py-3 rounded-lg shadow-md"
            >
              Explore Resources
            </Link>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-green-700 rounded-lg p-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Volunteer</h3>
              <p className="text-green-100">
                Lend your time, skills, and passion to projects that uplift our
                communities and create lasting impact.
              </p>
            </motion.div>

            <motion.div
              className="bg-green-700 rounded-lg p-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Partner With Us</h3>
              <p className="text-green-100">
                Work alongside us on transformative initiatives that reflect
                your vision and contribute to Plateau’s future.
              </p>
            </motion.div>

            <motion.div
              className="bg-green-700 rounded-lg p-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Provide Feedback</h3>
              <p className="text-green-100">
                Offer your feedback, insights, and ideas to help us refine our
                strategies and better serve our people.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
