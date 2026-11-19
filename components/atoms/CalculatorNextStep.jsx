"use client";

import Link from "next/link";

export default function CalculatorNextStep({
  heading,
  description,
  primaryCta,
  secondaryLinks,
  source,
  calculatorId,
  showEnquiry,
}) {
  const sourceQuery = source ? `?source=${source}` : "";
  const backQuery = calculatorId ? `&back=/${calculatorId}` : "";

  return (
    <section
      className="mt-8 rounded-xl bg-white p-6 sm:p-8 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      aria-labelledby="calculator-next-step-heading"
    >
      <h2
        id="calculator-next-step-heading"
        className="mb-3 text-lg font-semibold text-gray-900 dark:text-white"
      >
        {heading}
      </h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Link
          href={primaryCta.href + sourceQuery + backQuery}
          className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
        >
          {primaryCta.label}
        </Link>
        {secondaryLinks?.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href + sourceQuery + backQuery}
                className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        {showEnquiry && calculatorId && (
          <Link
            href={`/expert-connect?source=${source}&back=/${calculatorId}`}
            className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
          >
            Connect to an Expert
          </Link>
        )}
      </div>
    </section>
  );
}
