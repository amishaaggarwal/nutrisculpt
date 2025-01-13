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
      <div className="min-h-screen bg-gray-100 text-gray-800 transition-colors dark:bg-gray-900 dark:text-gray-200">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-blue-600 py-20 text-center text-white dark:bg-blue-500">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-3xl"
            >
              <h2 className="text-4xl font-bold">
                Achieve Your Dream Fitness Goals
              </h2>
              <p className="mt-4 text-lg">
                Transform your body and soul with the perfect blend of
                personalized nutrition and energizing workouts, guided by your
                friend and coach, AK. Together, let&apos;s sculpt the best
                version of you!
              </p>
              <motion.a
                href="#contact"
                className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-bold text-blue-600 shadow-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                whileHover={{ scale: 1.1 }}
              >
                Get Started
              </motion.a>
            </motion.div>
          </section>

          {/* Services Section */}
          <section id="services" className="bg-gray-100 py-20 dark:bg-gray-900">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            >
              <h3 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-200">
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
                    className="rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800"
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
            className="bg-white py-20 dark:bg-gray-800"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            >
              <h3 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-200">
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
                    className="rounded-lg bg-gray-100 p-6 shadow-lg dark:bg-gray-700"
                  >
                    <p className="text-gray-600 dark:text-gray-400">
                      {testimonial}
                    </p>
                    <h5 className="mt-4 font-bold text-blue-600 dark:text-blue-400">
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

        <footer className="bg-gray-800 py-4 text-center text-gray-200">
          <p>&copy; 2025 {BRAND}. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
