"use client";

import ContactSection from "@/components/atoms/ContactUs";
import {
  SERVICE_CATEGORIES,
  CATEGORY_ICONS,
  QUALIFICATIONS,
} from "@/constants/services";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDumbbell,
  faHeartPulse,
  faPersonWalking,
  faBook,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <main className="w-full">
      {/* A. Hero */}
      <section id="hero" className="relative bg-white py-24 dark:bg-gray-900 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-x-1/2 translate-y-[-25%] rounded-full bg-blue-500/10 dark:bg-blue-900/20 blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] -translate-x-1/4 translate-y-[10%] rounded-full bg-blue-500/5 dark:bg-blue-900/5 -z-10"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-8">
              SCIENCE-INFORMED FITNESS &amp; EXERCISE COACHING
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Nourishing Bodies &amp; Sculpting Greatness
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-medium leading-relaxed">
              Build Strength. Move Better. Live Stronger.
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-lg mx-auto">
              Personalized exercise coaching to support your strength,
              health-focused fitness, movement, and performance goals—built
              around your abilities, needs, and stage of life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.a
                href="/transformation"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700"
                whileHover={{ scale: 1.02 }}
              >
                Start Your Transformation
              </motion.a>
              <Link
                href="/#services"
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-8 py-4 font-bold text-gray-900 dark:text-white shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Explore Our Services
              </Link>
            </div>
            <p className="mt-10 text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
              Begin by exploring your fitness metrics with our comprehensive
              calculators.
            </p>
          </div>
        </div>
      </section>

      {/* B. Who We Help */}
      <section id="who-we-help" className="bg-gray-50 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Who We Help
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              NutriSculpt works with people at every stage of life pursuing
              general fitness, strength, movement, health-focused exercise, and
              performance goals.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "General fitness",
                text: "Building a sustainable, well-rounded exercise habit.",
              },
              {
                label: "Strength development",
                text: "Progressive training to get stronger safely.",
              },
              {
                label: "Movement & posture",
                text: "Improving mobility, alignment, and everyday function.",
              },
              {
                label: "Health-focused exercise",
                text: "Individualized programming for health considerations.",
              },
              {
                label: "Athletic performance",
                text: "Sport-specific conditioning for performance goals.",
              },
              {
                label: "Fitness education",
                text: "Learning to train independently with confidence.",
              },
              {
                label: "Older adults",
                text: "Age-appropriate training for strength and independence.",
              },
              {
                label: "Special populations",
                text: "Exercise support complementary to medical care.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-lg bg-white p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-center"
              >
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {item.label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* C. Our Services */}
      <section id="services" className="bg-white py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Five core categories. Each organizes related services so you can
              find the right approach for your goals.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ scale: 0.95, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <FontAwesomeIcon
                    icon={CATEGORY_ICONS[category.icon]}
                    className="h-6 w-6"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-5">
                  {category.shortDescription}
                </p>
                <Link
                  href={`/services/category/${category.slug}`}
                  className="block text-center rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow transition hover:bg-blue-700"
                >
                  Explore Services →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* D. The NutriSculpt Approach */}
      <section id="approach" className="bg-gray-50 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              The NutriSculpt Approach
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Individualized goals, thoughtful exercise selection, progressive
              training, coaching, and practical education.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                title: "Individualized goals",
                text: "Programming built around your abilities, needs, and stage of life.",
                icon: faChartLine,
              },
              {
                title: "Thoughtful exercise selection",
                text: "Every movement chosen for purpose, safety, and relevance to your goals.",
                icon: faDumbbell,
              },
              {
                title: "Progressive training",
                text: "Structured progression so you keep improving over time.",
                icon: faHeartPulse,
              },
              {
                title: "Coaching and accountability",
                text: "Ongoing guidance to help you stay consistent and confident.",
                icon: faPersonWalking,
              },
              {
                title: "Practical fitness education",
                text: "Knowledge to train independently and manage your own journey.",
                icon: faBook,
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-lg bg-white p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-center"
              >
                <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* E. Qualifications & Experience */}
      <section id="qualifications" className="bg-white py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Qualifications &amp; Experience
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Credentials you can trust, stated accurately.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-3">
            {QUALIFICATIONS.map((q, index) => (
              <motion.div
                key={q.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-6 dark:bg-gray-800 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                  {q.status}
                </p>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {q.name}
                </h4>
                {q.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {q.note}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* F. How We Work With You */}
      <section id="how-we-work" className="bg-gray-50 py-16 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How We Work With You
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Flexible coaching options built around your life.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "In-person one-to-one coaching",
                text: "Personalized training sessions with expert guidance and real-time form correction.",
              },
              {
                title: "Online coaching",
                text: "Virtual 1-1 sessions with live feedback and customized programming, anywhere.",
              },
              {
                title: "Consultations &amp; assessments",
                text: "Individualized assessment to understand your goals and movement needs.",
              },
              {
                title: "Individualized programming",
                text: "Custom workout plans with progression tracking tailored to you.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-lg bg-white p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-center"
              >
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* G. Testimonials + enquiry CTA */}
      <section id="testimonials" className="bg-white py-20 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            What Clients Say
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
            Genuine feedback from people we have worked with.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-2">
            {[
              {
                text: "Working with NutriSculpt has completely transformed my approach to fitness. The personalized training sessions helped me correct my posture issues from years of desk work, and I've never felt stronger or more confident. The attention to detail in movement analysis is incredible!",
                name: "Priya Sharma",
                role: "Software Engineer",
              },
              {
                text: "The virtual training sessions are amazing! Even from abroad, I get the same quality of coaching as in-person sessions. The program design is tailored to my goals and the recovery protocols have helped me stay injury-free while building strength.",
                name: "Rahul Mehta",
                role: "Marketing Professional",
              },
              {
                text: "As an athlete, the sports performance program took my game to the next level. The functional movement testing identified weaknesses I didn't know I had, and the targeted training improved my agility and power significantly.",
                name: "Arjun Patel",
                role: "Cricket Player",
              },
              {
                text: "The rehabilitation program after my shoulder injury was exceptional. The blend of corrective exercises and recovery techniques helped me return to full strength faster than I expected. Highly recommend NutriSculpt!",
                name: "Neha Singh",
                role: "Teacher",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="rounded-lg bg-gray-100 p-6 shadow-lg dark:bg-gray-700"
              >
                <p className="text-gray-600 italic dark:text-gray-400">
                  {testimonial.text}
                </p>
                <h5 className="mt-4 font-bold text-blue-600 dark:text-blue-400">
                  - {testimonial.name}, {testimonial.role}
                </h5>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              href="/expert-connect"
              className="rounded bg-green-600 px-8 py-3 font-bold text-white shadow transition hover:bg-green-700"
            >
              Connect to an expert
            </Link>
          </div>
        </div>
      </section>

      <ContactSection />
    </main>
  );
};

export default Home;
