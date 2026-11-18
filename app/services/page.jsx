import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  SERVICE_CATEGORIES,
  CATEGORY_ICONS,
} from "@/constants/services";

export const metadata = {
  title: "Our Coaching Services | NutriSculpt",
  description:
    "Explore NutriSculpt's five coaching service categories: personal training, health-focused fitness, movement and posture, athletic performance, and fitness education. Find the right approach for your goals.",
};

export default function Services() {
  return (
    <main className="w-full">
      <section className="bg-white py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Coaching Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Five core categories. Each organizes related coaching services so
              you can find the right approach for your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_CATEGORIES.map((category) => (
              <div
                key={category.slug}
                className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FontAwesomeIcon
                    icon={CATEGORY_ICONS[category.icon]}
                    className="h-6 w-6"
                  />
                </div>
                <h3 className="mb-2 min-h-[3.5rem] text-center text-xl font-bold text-gray-900 dark:text-white">
                  {category.title}
                </h3>
                <p className="mb-6 flex-1 text-center text-gray-600 dark:text-gray-400 leading-relaxed">
                  {category.shortDescription}
                </p>
                <Link
                  href={`/services/category/${category.slug}`}
                  className="mt-auto block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white shadow transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                >
                  Explore {category.title} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Not Sure Where to Start?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us about your goals and we will help you explore a suitable
              coaching approach.
            </p>
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              href="/expert-connect?source=services&back=/services"
              className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white shadow transition hover:bg-blue-700"
            >
              Connect to an Expert
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
