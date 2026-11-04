"use client";

import Link from "next/link";

export default function AthleticPerformance() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">← Back to Services</Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold">Athletic & Sports Performance</h1>
      <section className="space-y-6 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          Sport-specific training to enhance performance, speed, agility, power, and resilience for competitive athletes and sports enthusiasts.
        </p>
        <h2 className="text-xl font-semibold">What You Get</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
          <li>Sport-specific needs analysis</li>
          <li>Speed, agility, and power development</li>
          <li>Strength and conditioning tailored to your sport</li>
          <li>Injury prevention and recovery protocols</li>
          <li>Performance testing and tracking</li>
        </ul>
        <h2 className="text-xl font-semibold">Ideal For</h2>
        <p className="text-gray-700 dark:text-gray-300">Competitive athletes, weekend warriors, or anyone looking to elevate their athletic performance.</p>
      </section>
      <div className="mt-8 flex justify-center">
        <Link
          href="/expert-connect?back=/services/athletic-sports-performance"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
