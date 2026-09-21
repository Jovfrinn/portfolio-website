"use client";

import { motion } from "framer-motion";

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const ServiceCard = ({ name, description }) => {
  return (
    <motion.div
      variants={cardReveal}
      whileHover={{ y: -4 }}
      className="glow-card w-full p-8 rounded-2xl border border-white/10 bg-white/[0.02] transition-colors duration-300 hover:border-brand-400/30"
    >
      <h1 className="font-display text-lg font-bold text-white tracking-tight">
        {name ? name : "Heading"}
      </h1>
      <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
        {description
          ? description
          : "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
      </p>
    </motion.div>
  );
};

export default ServiceCard;
