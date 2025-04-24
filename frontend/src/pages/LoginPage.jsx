/* eslint-disable no-unused-vars */
import LoginForm from "@/components/auth/LoginForm";
import { motion } from "framer-motion";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 overflow-hidden relative">
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
        className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/5"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
      <motion.div
        className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full bg-white/5"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 1 }}
      />
      <motion.div
        className="absolute top-1/3 left-10 w-16 h-16 rounded-full bg-white/10"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
      />

      <LoginForm />
      <BrandingSide />
    </div>
  );
};

const BrandingSide = () => {
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
      className="hidden md:flex md:w-1/2 text-white flex-col items-center justify-center p-8 z-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="z-10 max-w-md" variants={containerVariants}>
        <div className="flex flex-col md:flex-row items-center mb-8">
          <motion.div
            className="flex-shrink-0 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4 md:mb-0 md:mr-5"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(255, 255, 255, 0.3)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <svg
              className="w-12 h-12"
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
              className="text-3xl md:text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Welcome back
            </motion.h1>
            <motion.p variants={itemVariants} className="text-white/80 mt-2">
              Continue your conversations
            </motion.p>
          </div>
        </div>

        <motion.div variants={imageVariants} className="my-8 relative">
          <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm bg-white/10">
            <div className="h-48 w-full relative">
              {/* Abstract shapes */}
              <motion.div
                className="absolute top-6 left-6 w-20 h-20 rounded-full bg-white/10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              <motion.div
                className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
              <motion.div
                className="absolute top-16 right-16 w-16 h-16 rounded-full bg-white/20"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              />

              {/* Messaging visualization */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-2 items-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <div className="h-12 w-12 rounded-full bg-white/30 border-2 border-white/30 flex items-center justify-center">
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

                <div className="flex flex-col space-y-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 100 }}
                    transition={{ delay: 1.3, duration: 0.4 }}
                    className="h-2 bg-white/40 rounded-full w-[100px]"
                  ></motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 80 }}
                    transition={{ delay: 1.5, duration: 0.4 }}
                    className="h-2 bg-white/40 rounded-full w-[80px]"
                  ></motion.div>
                </div>
              </motion.div>

              {/* Notification dot */}
              <motion.div
                className="absolute top-4 right-4 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 1.7, duration: 0.5, times: [0, 0.6, 1] }}
              >
                5
              </motion.div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4">
                <h3 className="text-white font-bold">Resume your chats</h3>
                <p className="text-white/70 text-sm">
                  Pick up right where you left off
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">
            What's waiting for you:
          </h2>

          {[
            "Unread messages from your contacts",
            "Recent group conversation updates",
            "Shared media and documents",
            "Missed calls and voicemails",
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center"
              custom={index}
              variants={featureVariants}
              whileHover="hover"
            >
              <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3 flex-shrink-0">
                <svg
                  width="16"
                  height="16"
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
              <p className="text-white/90">{feature}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center md:text-left"
          variants={itemVariants}
        >
          <p className="text-white/60 text-sm">
            Sign in now to stay connected with your friends and family.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;
