"use client";

import ContactSection from "@/components/atoms/ContactUs";
import Header from "@/components/atoms/Header";
import { BRAND } from "@/constants";
import { motion } from "framer-motion";
import { useState } from "react";

const Home = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen transition-colors">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main>
          {/* Hero Section */}
          <section className="relative bg-blue-600 dark:bg-blue-500 text-white py-20 text-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-4xl font-bold">
                Achieve Your Dream Fitness Goals
              </h2>
              <p className="mt-4 text-lg">
                Transform your body and soul with the perfect blend of
                personalized nutrition and energizing workouts, guided by your
                friend and coach, AK. Together, let's sculpt the best version of
                you!
              </p>
              <motion.a
                href="#contact"
                className="mt-6 inline-block bg-white text-blue-600 font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 transition"
                whileHover={{ scale: 1.1 }}
              >
                Get Started
              </motion.a>
            </motion.div>
          </section>

          {/* Services Section */}
          <section id="services" className="py-20 bg-gray-100 dark:bg-gray-900">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
                Our Services
              </h3>
              <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
                {[
                  "Personal Training",
                  "Group Classes",
                  "Nutrition Coaching",
                ].map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center"
                  >
                    <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {service}
                    </h4>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      Experience {service.toLowerCase()} tailored to your needs.
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Testimonials Section */}
          <section
            id="testimonials"
            className="py-20 bg-white dark:bg-gray-800"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
                What Clients Say
              </h3>
              <div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-2">
                {[
                  '"I\'ve never felt healthier!"',
                  '"The group classes are so much fun!"',
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-gray-100 dark:bg-gray-700 shadow-lg rounded-lg p-6"
                  >
                    <p className="text-gray-600 dark:text-gray-400">
                      {testimonial}
                    </p>
                    <h5 className="mt-4 text-blue-600 dark:text-blue-400 font-bold">
                      - Client
                    </h5>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Contact Section */}
          <ContactSection />
        </main>

        <footer className="bg-gray-800 text-gray-200 py-4 text-center">
          <p>&copy; 2025 {BRAND}. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
