import {
  faDumbbell,
  faPersonWalking,
  faHeartPulse,
  faUserGroup,
  faBook,
} from "@fortawesome/free-solid-svg-icons";

export const SERVICE_CATEGORIES = [
  {
    slug: "strength-fitness-performance",
    title: "Personal Training & Strength Development",
    icon: "Dumbbell",
    description:
      "Build strength, improve fitness, and achieve meaningful physical goals through individualized exercise coaching and structured training programs suited to your needs and experience.",
    shortDescription:
      "Personalized strength training and goal-focused programming.",
    areas: [
      {
        title: "Strength & Resistance Training",
        description:
          "Focus on building strength, developing proper exercise technique, progressive resistance training and improving overall physical fitness.",
      },
      {
        title: "Goal-Based Fitness Coaching",
        description:
          "Support goals such as first pull-ups, stronger deadlifts, better plank endurance, general fitness improvement, body-composition goals and preparation for personal events.",
      },
      {
        title: "Personalized Workout Programming",
        description:
          "Provide individualized exercise plans according to experience, goals, equipment availability, schedule and progression needs.",
      },
    ],
  },
  {
    slug: "metabolic-bone-health",
    title: "Exercise for Special Populations & Health-Focused Fitness",
    icon: "HeartPulse",
    description:
      "Individualized exercise support for people with metabolic health concerns, older adults, bone-health considerations and youth, with appropriate screening and medical clearance when needed.",
    shortDescription:
      "Individualized exercise support for health considerations, complementary to medical care.",
    areas: [
      {
        title: "Metabolic Health Exercise Support",
        description:
          "Structured exercise support for people managing metabolic health concerns, designed to complement appropriate medical care. Screening or medical clearance may be advised before starting.",
      },
      {
        title: "Active Ageing & Bone Health",
        description:
          "Strength, balance and bone-health-focused exercise for older adults and those with bone-health considerations, planned to support physical function alongside medical guidance when appropriate.",
      },
      {
        title: "Youth & Age-Appropriate Fitness",
        description:
          "Age-appropriate exercise for children and adolescents that builds movement skills, strength and healthy habits with consideration for developmental needs.",
      },
    ],
  },
  {
    slug: "pain-posture-movement",
    title: "Movement, Posture & Functional Fitness",
    icon: "PersonWalking",
    description:
      "Improve movement quality, posture, mobility and everyday physical function through individualized coaching and appropriate exercise programming for common movement concerns.",
    shortDescription:
      "Move better and stand taller with posture, mobility, and movement support.",
    areas: [
      {
        title: "Mobility & Postural Awareness",
        description:
          "Improve joint mobility, alignment and postural awareness to support comfortable, efficient movement in daily life and training.",
      },
      {
        title: "Functional Strength for Daily Living",
        description:
          "Build practical strength, balance and physical function for everyday activities such as lifting, carrying, climbing stairs and sustained movement.",
      },
      {
        title: "Movement Coaching for Common Discomforts",
        description:
          "Exercise-based movement coaching for people with back, shoulder or knee concerns, focused on mobility, strength and movement confidence. Not a medical diagnosis or treatment.",
      },
    ],
  },
  {
    slug: "functional-fitness-life-stages",
    title: "Athletic Performance & Conditioning",
    icon: "UserGroup",
    description:
      "Sport-focused strength and conditioning support to improve performance capacity through individualized, progressive training based on your goals, experience and readiness.",
    shortDescription:
      "Strength and conditioning for athletic performance goals.",
    areas: [
      {
        title: "Athletic Strength & Power",
        description:
          "Develop sport-relevant strength and power through progressive resistance training and structured programming tailored to your performance goals.",
      },
      {
        title: "Endurance & Conditioning",
        description:
          "Build cardiovascular fitness, work capacity and conditioning with training planned around your sport, schedule and current fitness level.",
      },
      {
        title: "Speed, Agility & Sport Readiness",
        description:
          "Improve speed, agility and movement preparedness for sport and training demands with practical, progressive drills and conditioning work.",
      },
    ],
  },
  {
    slug: "fitness-education-independence",
    title: "Fitness Education & Independent Training",
    icon: "Book",
    description:
      "Learn exercise technique, training principles and workout planning to build the knowledge and confidence needed to manage your own fitness journey effectively.",
    shortDescription:
      "Learn to train with confidence — technique, programming, and independence.",
    areas: [
      {
        title: "Exercise Fundamentals & Technique",
        description:
          "Develop proper exercise technique, safe movement habits and gym confidence through clear coaching on foundational exercises.",
      },
      {
        title: "Training Principles & Progression",
        description:
          "Understand workout structure, progressive overload and key training principles so you can train with purpose and adapt over time.",
      },
      {
        title: "Independent Workout Planning",
        description:
          "Learn to plan and organize your own workouts based on goals, schedule and available equipment with confidence and clarity.",
      },
    ],
  },
];

export const QUALIFICATIONS = [
  {
    name: "ACSM Certified Personal Trainer (CPT)",
    status: "Earned",
  },
  {
    name: "ACSM Special Population Exercise Certification",
    status: "Earned (ACSM-accredited)",
  },
  {
    name: "NSCA Strength & Conditioning qualification",
    status: "Currently pursuing",
    note: "Not yet completed",
  },
];

export const GOAL_DISCOVERY_OPTIONS = [
  {
    id: "build-strength",
    label: "Build strength and improve fitness.",
    categorySlug: "strength-fitness-performance",
  },
  {
    id: "posture-movement",
    label: "Improve posture, mobility or movement.",
    categorySlug: "pain-posture-movement",
  },
  {
    id: "health-concern",
    label: "Get exercise support for a health-related concern.",
    categorySlug: "metabolic-bone-health",
  },
  {
    id: "physical-independence",
    label: "Improve everyday physical independence.",
    categorySlug: "functional-fitness-life-stages",
  },
  {
    id: "train-independently",
    label: "Learn to train independently.",
    categorySlug: "fitness-education-independence",
  },
  {
    id: "event-goal",
    label: "Prepare for an event or specific fitness goal.",
    categorySlug: "strength-fitness-performance",
  },
];

export const CATEGORY_ICONS = {
  Dumbbell: faDumbbell,
  PersonWalking: faPersonWalking,
  HeartPulse: faHeartPulse,
  UserGroup: faUserGroup,
  Book: faBook,
};

export const ENQUIRY_SERVICE_OPTIONS = [
  {
    value: "strength-fitness-performance",
    label: "Personal Training & Strength Development",
  },
  {
    value: "metabolic-bone-health",
    label: "Exercise for Special Populations & Health-Focused Fitness",
  },
  {
    value: "pain-posture-movement",
    label: "Movement, Posture & Functional Fitness",
  },
  {
    value: "functional-fitness-life-stages",
    label: "Athletic Performance & Conditioning",
  },
  {
    value: "fitness-education-independence",
    label: "Fitness Education & Independent Training",
  },
  {
    value: "not-sure",
    label: "Not Sure Yet — Help Me Choose",
  },
];

export const ENQUIRY_CATEGORY_ALLOWLIST = new Set(
  ENQUIRY_SERVICE_OPTIONS.map((option) => option.value)
);
