import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWhatsapp,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";
import { LINKS } from "@/constants";

const socials = [
  {
    label: "WhatsApp",
    icon: faWhatsapp,
    color: `text-green-600 dark:text-green-400`,
  },
  {
    label: "Instagram",
    icon: faInstagram,
    color: `text-blue-600 dark:text-blue-400`,
  },
  {
    label: "YouTube",
    icon: faYoutube,
    color: `text-red-600 dark:text-red-400`,
  },
];
const SocialLink = ({ icon, color, label }) => {
  return (
    <motion.a
      href={LINKS?.[label?.toLowerCase()]}
      target="_blank"
      className={`inline-flex items-center justify-center bg-white  font-bold py-3 px-3 sm:px-6 rounded-lg shadow-lg hover:bg-gray-200 dark:bg-gray-800  dark:hover:bg-gray-700 transition w-fit sm:w-auto gap-2 ${color}`}
      whileHover={{ scale: 1.1 }}
    >
      <FontAwesomeIcon icon={icon} size="lg" />
      <span className="hidden sm:block">{label}</span>
    </motion.a>
  );
};
const ContactSection = () => {
  return (
    <section
      id="contact"
      className="bg-blue-600 py-20 text-white dark:bg-blue-500"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h3 className="text-3xl font-bold">Get In Touch</h3>
        <p className="mt-4">
          Have questions or ready to start your journey? Contact us now!
        </p>

        {/* Button Container */}
        <div className="mt-6 flex items-center justify-center gap-6">
          {socials.map(({ label, color, icon }) => (
            <SocialLink key={label} icon={icon} color={color} label={label} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default ContactSection;
