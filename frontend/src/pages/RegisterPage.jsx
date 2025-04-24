/* eslint-disable no-unused-vars */
import RegisterForm from "@/components/auth/RegisterForm";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

const RegisterPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row md:items-center ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900"
          : "bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800"
      } overflow-hidden relative`}
    >
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Circles decoration */}
      <motion.div
        className={`absolute top-10 right-10 w-24 h-24 md:w-32 md:h-32 rounded-full ${
          isDark ? "bg-teal-900/20" : "bg-white/5"
        }`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
      <motion.div
        className={`absolute bottom-20 left-1/4 w-16 h-16 md:w-24 md:h-24 rounded-full ${
          isDark ? "bg-teal-900/20" : "bg-white/5"
        }`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 1 }}
      />
      <motion.div
        className={`absolute top-1/3 left-10 w-12 h-12 md:w-16 md:h-16 rounded-full ${
          isDark ? "bg-teal-900/30" : "bg-white/10"
        }`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
      />

      <RegisterForm />
      <BrandingSide />
    </div>
  );
};

const BrandingSide = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const featureVariants = {
    hidden: { x: -30, opacity: 0 },
    visible: (custom) => ({
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: custom * 0.2,
      },
    }),
    hover: {
      x: 10,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div
      className="hidden md:flex md:w-1/2 text-white flex-col items-start justify-center md:pl-16 lg:pl-24 z-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="z-10 w-full max-w-md mx-auto px-4 lg:px-0"
        variants={containerVariants}
      >
        <div className="flex flex-col md:flex-row items-center mb-6 lg:mb-8">
          <motion.div
            className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 ${
              isDark ? "bg-teal-900/50" : "bg-white/20"
            } rounded-full flex items-center justify-center backdrop-blur-sm mb-4 md:mb-0 md:mr-5`}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(255, 255, 255, 0.3)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <svg
              className="w-10 h-10 lg:w-12 lg:h-12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M12 19.5C16.14 19.5 19.5 16.14 19.5 12C19.5 7.86 16.14 4.5 12 4.5C7.86 4.5 4.5 7.86 4.5 12C4.5 13.76 5.12 15.38 6.15 16.65L4.5 19.5L7.35 17.85C8.62 18.88 10.24 19.5 12 19.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>
          <div className="text-center md:text-left">
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Join the conversation
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-sm lg:text-base text-white/80 mt-2"
            >
              Connect with friends and family
            </motion.p>
          </div>
        </div>

        <motion.div variants={imageVariants} className="my-6 lg:my-8 relative">
          <div
            className={`relative z-10 rounded-xl overflow-hidden shadow-2xl border ${
              isDark
                ? "border-teal-800/50 bg-gray-900/50"
                : "border-white/20 bg-white/10"
            } backdrop-blur-sm`}
          >
            <div className="h-40 lg:h-48 w-full relative">
              {/* Abstract shapes */}
              <motion.div
                className={`absolute top-6 left-6 w-16 h-16 lg:w-20 lg:h-20 rounded-full ${
                  isDark ? "bg-teal-900/30" : "bg-white/10"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              <motion.div
                className={`absolute bottom-10 right-10 w-24 h-24 lg:w-32 lg:h-32 rounded-full ${
                  isDark ? "bg-teal-900/30" : "bg-white/10"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
              <motion.div
                className={`absolute top-16 right-16 w-12 h-12 lg:w-16 lg:h-16 rounded-full ${
                  isDark ? "bg-teal-900/50" : "bg-white/20"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              />

              {/* Profile setup visualization */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-full bg-white/30 border-2 border-white/30 flex items-center justify-center mb-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>

                <div className="flex space-x-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.3, duration: 0.4 }}
                    className={`h-5 w-5 lg:h-6 lg:w-6 rounded-full ${
                      isDark ? "bg-teal-500" : "bg-white/60"
                    } flex items-center justify-center`}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17L4 12"></path>
                    </svg>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.4 }}
                    className="h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-white/30 flex items-center justify-center text-xs"
                  >
                    2
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.7, duration: 0.4 }}
                    className="h-5 w-5 lg:h-6 lg:w-6 rounded-full bg-white/30 flex items-center justify-center text-xs"
                  >
                    3
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4">
                <h3 className="text-white font-bold text-sm lg:text-base">
                  Create your profile
                </h3>
                <p className="text-white/70 text-xs lg:text-sm">
                  Complete setup in just a few steps
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3">
            Why join us today:
          </h2>

          {[
            "Instant messaging with friends and family",
            "Secure group conversations",
            "Share photos, videos and documents",
            "Voice and video calling features",
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center"
              custom={index}
              variants={featureVariants}
              whileHover="hover"
            >
              <div
                className={`h-6 w-6 lg:h-8 lg:w-8 rounded-full ${
                  isDark ? "bg-teal-900/50" : "bg-white/20"
                } backdrop-blur-sm flex items-center justify-center mr-3 flex-shrink-0`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-white/90 text-sm lg:text-base">{feature}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center md:text-left"
          variants={itemVariants}
        >
          <p className="text-white/60 text-xs lg:text-sm">
            Sign up now to join millions of users already on our platform.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RegisterPage;
