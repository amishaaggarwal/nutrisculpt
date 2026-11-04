"use client";

import Link from "next/link";

export default function PostureMobility() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Posture Correction & Mobility Training</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Correct muscular imbalances, relieve pain, and improve mobility with targeted exercises to restore optimal posture and movement patterns.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Postural assessment and analysis</li>
          <li>Targeted mobility and strengthening exercises</li>
          <li>Desk-worker specific corrections</li>
          <li>Pain relief strategies</li>
          <li>Long-term maintenance plan</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Desk workers, those with chronic tightness/pain, or anyone wanting better alignment and movement.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/posture-correction-mobility"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
