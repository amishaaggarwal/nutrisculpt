"use client";

import Link from "next/link";

export default function FunctionalMovementTesting() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Functional Movement Testing</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Comprehensive movement analysis to identify imbalances, mobility restrictions, and injury risks. Get a detailed report with actionable recommendations.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Full movement screening (mobility, stability, patterning)</li>
          <li>Identification of compensations and weaknesses</li>
          <li>Detailed written report with findings</li>
          <li>Personalized corrective exercise plan</li>
          <li>Injury prevention strategies</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Anyone starting a new program, recovering from pain, or looking to optimize movement quality.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/functional-movement-testing"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
