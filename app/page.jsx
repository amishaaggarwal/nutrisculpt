"use client";

import ContactSection from "@/components/atoms/ContactUs";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <>
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-blue-600 py-20 text-center text-white dark:bg-blue-700">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl"
          >
            <h2 className="mt-10 text-4xl font-bold">
              Nourishing Bodies & Sculpting Greatness
            </h2>
            <p className="mt-4 text-lg">
              Transform your health with NutriSculpt’s expert-led
              coaching—covering personal training, online fitness, posture
              correction, rehabilitation, recovery, and athletic performance.
              Train smarter, recover faster, and sculpt your best self.
            </p>

            <motion.a
              href="#contact"
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-bold text-blue-600 shadow-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
              whileHover={{ scale: 1.1 }}
            >
              Start Your Transformation
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
                {
                  title: "Personal 1-1 Training",
                  description:
                    "Personalized one-on-one training sessions with expert guidance, form correction, and customized workout plans to maximize your results.",
                },
                {
                  title: "Virtual 1-1 Training",
                  description:
                    "Online personal training for clients in India and abroad—professional coaching anytime, anywhere, delivering results equal to in-person sessions.",
                },
                {
                  title: "Functional Movement Testing",
                  description:
                    "Comprehensive movement analysis with detailed report identifying imbalances, mobility issues, and injury prevention strategies.",
                },
                {
                  title: "Program Design (1-3 months)",
                  description:
                    "Custom workout programs with detailed weekly plans designed specifically for your goals, complete with progression tracking.",
                },
                {
                  title: "Posture Correction & Mobility Training",
                  description:
                    "Correct imbalances, relieve pain, and improve mobility with targeted exercises designed to restore posture, enhance movement, and prevent injuries.",
                },
                {
                  title: "Group Training",
                  description:
                    "Small group training sessions that combine motivation with personalized attention for an engaging and effective workout experience.",
                },
                {
                  title: "Rehabilitation & Recovery Programs",
                  description:
                    "Holistic programs blending rehabilitation and recovery to restore strength, enhance mobility, support healing, and prevent future injuries through corrective training.",
                },
                {
                  title: "Athletic & Sports Performance",
                  description:
                    "Sport-specific training programs to enhance performance, speed, agility, and power for competitive athletes and sports enthusiasts.",
                },
                {
                  title: "Senior Fitness Programs",
                  description:
                    "Specialized fitness programs for older adults focusing on balance, strength, mobility, and maintaining independence and quality of life.",
                },
              ].map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800"
                >
                  <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {service.title}
                  </h4>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-white py-20 dark:bg-gray-800">
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
                `"I've never felt healthier!"`,
                `"The group classes are so much fun!"`,
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
    </>
  );
};

export default Home;
