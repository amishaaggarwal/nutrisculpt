import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDumbbell,
  faBullseye,
  faClipboardList,
  faHeartPulse,
  faPersonWalking,
  faChild,
  faHands,
  faPerson,
  faBolt,
  faGaugeHigh,
  faBookOpen,
  faChartLine,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import { SERVICE_CATEGORIES, CATEGORY_ICONS } from "@/constants/services";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";

const AREA_ICONS = {
  "strength-fitness-performance": [faDumbbell, faBullseye, faClipboardList],
  "metabolic-bone-health": [faHeartPulse, faPersonWalking, faChild],
  "pain-posture-movement": [faHands, faPerson, faPersonWalking],
  "functional-fitness-life-stages": [faDumbbell, faGaugeHigh, faBolt],
  "fitness-education-independence": [faBookOpen, faChartLine, faCalendarCheck],
};

export default async function ServiceCategory({ params }) {
  const { slug } = await params;
  const category = SERVICE_CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            Back to Services
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
  const areaIcons = AREA_ICONS[category.slug] || [faDumbbell, faBullseye, faClipboardList];

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
        <Link
          href="/#services"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          Back to Services
        </Link>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <FontAwesomeIcon icon={Icon} size="lg" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {category.title}
        </h1>
      </div>
      <p className="max-w-3xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        {category.description}
      </p>

      {category.slug === "metabolic-bone-health" && (
        <div className="mt-6">
          <HealthDisclaimer
            universalDisclaimer={METABOLIC_UNIVERSAL}
            specificCaution={METABOLIC_SPECIFIC}
          />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">
          What We Help You With
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {category.areas.map((area, index) => (
            <div
              key={area.title}
              className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <FontAwesomeIcon icon={areaIcons[index]} className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {area.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/60">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ready to Work Toward Your Goals?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
          Tell us about your goals, experience and what support you&apos;re
          looking for. We&apos;ll help you explore a suitable coaching approach.
        </p>
        <div className="mt-6">
          <Link
            href={`/expert-connect?category=${encodeURIComponent(category.slug)}&source=service-category&back=${encodeURIComponent(`/services/category/${category.slug}`)}`}
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-bold text-white shadow transition hover:bg-blue-700"
          >
            Connect to an Expert
          </Link>
        </div>
      </section>

      <div className="mt-8">
        <Link
          href="/#services"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          Back to All Services
        </Link>
      </div>
    </main>
  );
}
