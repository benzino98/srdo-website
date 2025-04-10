import React from "react";
import ContactForm from "../components/contact/ContactForm";
import Map from "../components/contact/Map";
import ContactHero from "../components/contact/ContactHero";
import { motion } from "framer-motion";

const ContactPage: React.FC = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <ContactHero />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div
            id="contact-form"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="scroll-mt-16"
          >
            <h2 className="text-3xl font-bold mb-6 ml-6 text-gray-800">
              Send Us a Message
            </h2>
            <ContactForm />
          </motion.div>

          <motion.div
            id="find-us"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="scroll-mt-16"
          >
            <Map />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
