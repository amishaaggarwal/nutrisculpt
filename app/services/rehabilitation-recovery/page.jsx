"use client";

import Link from "next/link";

export default function RehabilitationRecovery() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Rehabilitation & Recovery Programs</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Holistic programs blending rehabilitation and recovery to restore strength, enhance mobility, support healing, and prevent future injuries.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Injury assessment and movement analysis</li>
          <li>Targeted corrective and strengthening exercises</li>
          <li>Mobility and tissue quality work</li>
          <li>Return-to-activity protocols</li>
          <li>Injury prevention strategies</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Those recovering from injury, dealing with chronic pain, or looking to rebuild after time off.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/rehabilitation-recovery"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
