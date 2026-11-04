"use client";

import Link from "next/link";

export default function ProgramDesign() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Program Design (1-3 months)</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Custom workout programs designed specifically for your goals, equipment access, and schedule. Complete with detailed guidance and progression.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Goal-specific program (1, 2, or 3 month duration)</li>
          <li>Detailed weekly breakdown with sets/reps/rest</li>
          <li>Exercise demos and form notes</li>
          <li>Progression guidelines</li>
          <li>Check-ins and adjustments as needed</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Self-motivated individuals who want expert programming without ongoing 1-1 sessions.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/program-design"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
