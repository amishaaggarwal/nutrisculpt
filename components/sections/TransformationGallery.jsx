"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { motion } from "framer-motion";

const EMPTY_PLACEHOLDERS = 3;

export default function TransformationGallery({ entries = [] }) {
  const hasEntries = entries && entries.length > 0;

  return (
    <section id="transformation-gallery" className="bg-white py-20 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real People. Real Progress.
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Client transformations will be showcased here with real client
            photographs, goals, training approach, duration, and progress —
            shared only with explicit consent.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hasEntries ? (
            entries.map((entry, index) => (
              <motion.div
                key={entry.name || index}
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="rounded-lg overflow-hidden shadow-sm dark:bg-gray-800"
              >
                {entry.photo ? (
                  <Image
                    src={entry.photo}
                    alt={`${entry.name || "Client"} progress photo`}
                    width={400}
                    height={400}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <FontAwesomeIcon icon={faCamera} className="h-10 w-10" />
                  </div>
                )}
                <div className="p-5">
                  {entry.name && (
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {entry.name}
                    </h4>
                  )}
                  {entry.goals && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Goals:</span>{" "}
                      {entry.goals}
                    </p>
                  )}
                  {entry.approach && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Approach:</span>{" "}
                      {entry.approach}
                    </p>
                  )}
                  {entry.duration && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Duration:</span>{" "}
                      {entry.duration}
                    </p>
                  )}
                  {entry.progress && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Progress:</span>{" "}
                      {entry.progress}
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <>
              {[...Array(EMPTY_PLACEHOLDERS)].map((_, index) => (
                <motion.div
                  key={`placeholder-${index}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-3 dark:bg-gray-700 dark:text-gray-600">
                    <FontAwesomeIcon icon={faCamera} className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Client story placeholder
                  </h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Real client photograph and consent required
                  </p>
                </motion.div>
              ))}
            </>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold mb-1">Privacy &amp; consent</p>
          <p className="leading-relaxed">
            Client photographs and stories are displayed only with explicit
            written consent. No stock photos are used to represent client
            results, and no transformation statistics are published. Clients may
            request removal of their image and story at any time. Interested
            clients can enquire through the contact section.
          </p>
        </div>
      </div>
    </section>
  );
}
