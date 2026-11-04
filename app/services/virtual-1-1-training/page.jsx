"use client";

import Link from "next/link";

export default function VirtualTraining() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Virtual 1-1 Training</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Get expert coaching from anywhere in the world. Our virtual sessions deliver the same quality as in-person training with live feedback and personalized programming.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Live 1-1 sessions via video call</li>
          <li>Customized home/gym-friendly workout plans</li>
          <li>Real-time form feedback and corrections</li>
          <li>Nutrition and recovery guidance</li>
          <li>Flexible scheduling for global clients</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Busy professionals, travelers, or anyone who prefers training from home or their local gym.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/virtual-1-1-training"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
