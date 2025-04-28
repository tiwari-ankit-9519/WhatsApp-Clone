/* eslint-disable no-unused-vars */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LoginForm from "../../components/auth/LoginForm";
import { ModeToggle } from "../../components/ModeToggle";

const Login = () => {
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col bg-background"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <motion.header
        className="py-4 px-4 sm:px-6 flex justify-between items-center"
        variants={itemVariants}
      >
        <Link to="/welcome" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-primary-foreground"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <span className="font-bold text-foreground hidden sm:inline-block">
            ChatConnect
          </span>
        </Link>
        <ModeToggle />
      </motion.header>

      {/* Main Content */}
      <motion.main
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6"
        variants={itemVariants}
      >
        <div className="w-full max-w-md">
          <motion.div
            className="text-center mb-8 sm:mb-10"
            variants={itemVariants}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Sign in
            </h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back to ChatConnect
            </p>
          </motion.div>

          <LoginForm />
        </div>
      </motion.main>

      {/* Footer */}
      <motion.footer
        className="py-6 text-center text-sm text-muted-foreground"
        variants={itemVariants}
      >
        <p>
          &copy; {new Date().getFullYear()} ChatConnect. All rights reserved.
        </p>
      </motion.footer>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div
          className="absolute top-0 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
};

export default Login;
