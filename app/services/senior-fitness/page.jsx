"use client";

import Link from "next/link";

export default function SeniorFitness() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Senior Fitness Programs</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Specialized fitness programs for older adults focusing on balance, strength, mobility, and maintaining independence and quality of life.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Age-appropriate strength and balance training</li>
          <li>Mobility and flexibility work</li>
          <li>Fall prevention strategies</li>
          <li>Low-impact conditioning</li>
          <li>Focus on functional movements for daily life</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Older adults looking to stay active, improve balance, and maintain independence safely.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/senior-fitness"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
