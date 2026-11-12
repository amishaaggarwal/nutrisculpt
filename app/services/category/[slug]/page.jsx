import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import {
  SERVICE_CATEGORIES,
  CATEGORY_ICONS,
  BRAND_POSITIONING,
  BRAND_MESSAGE,
  QUALIFICATIONS,
} from "@/constants/services";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";

export default async function ServiceCategory({ params }) {
  const { slug } = await params;
  const category = SERVICE_CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <Link href="/#services" className="text-blue-600 hover:underline">
            ← Back to Services
          </Link>
        </div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Category Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The requested service category could not be found.
        </p>
      </main>
    );
  }

  const Icon = CATEGORY_ICONS[category.icon];

  const METABOLIC_UNIVERSAL = (
    <>
      Exercise programs in this category are designed to support general health
      and physical function. They are not a substitute for medical diagnosis,
      treatment, or advice from a qualified healthcare professional. These
      services do not promise to reverse, cure, or treat diabetes, osteoporosis,
      osteopenia, or any metabolic condition, and they do not replace
      physiotherapy or clinical treatment. Always consult your healthcare
      provider before beginning a new exercise program, especially if you have
      a medical condition.
    </>
  );

  const METABOLIC_SPECIFIC = (
    <>
      If you have diabetes, a metabolic condition, osteopenia, or osteoporosis,
      speak with your healthcare professional before starting exercise. Training
      should complement, not replace, appropriate medical care.
    </>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link href="/#services" className="text-blue-600 hover:underline">
          ← Back to Services
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <FontAwesomeIcon icon={Icon} size="lg" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {category.title}
        </h1>
      </div>
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
        {category.description}
      </p>

      <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium max-w-xl">
        {BRAND_POSITIONING}
      </p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 italic max-w-xl">
        {BRAND_MESSAGE}
      </p>

      <div className="mt-4 flex flex-col items-start gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
          Professional qualifications
        </p>
        <ul className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300 list-none p-0">
          {QUALIFICATIONS.map((q, index) => (
            <li key={index} className="flex items-center gap-1">
              {q.name}
              <span className="text-blue-600 dark:text-blue-400">
                {" - " + q.status}
              </span>
              {q.note && (
                <span className="text-gray-500 dark:text-gray-500">
                  ({q.note})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {category.slug === "metabolic-bone-health" && (
        <div className="mt-6">
          <HealthDisclaimer
            universalDisclaimer={METABOLIC_UNIVERSAL}
            specificCaution={METABOLIC_SPECIFIC}
          />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Services in this category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.subcategories.map((sub) => (
            <Link
              key={sub.title}
              href={sub.href}
              className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {sub.title}
                </h3>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {sub.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 flex justify-center">
        <Link
          href="/expert-connect"
          className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
        >
          Connect to an expert
        </Link>
      </div>
    </main>
  );
}
