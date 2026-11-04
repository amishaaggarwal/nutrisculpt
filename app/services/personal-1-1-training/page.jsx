"use client";

import Link from "next/link";

export default function PersonalTraining() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Personal 1-1 Training</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Experience fully personalized training tailored to your goals, fitness level, and schedule. Each session is designed with precision to maximize results while prioritizing safety and proper form.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Custom workout plan based on assessment</li>
          <li>Real-time form correction and technique coaching</li>
          <li>Goal-specific programming (strength, fat loss, mobility)</li>
          <li>Progress tracking and regular program updates</li>
          <li>Accountability and motivation throughout your journey</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Anyone looking for dedicated attention, faster results, and expert guidance in a private setting.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/personal-1-1-training"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
