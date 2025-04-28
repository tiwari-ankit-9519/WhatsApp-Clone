/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ModeToggle } from "../components/ModeToggle";
import AppMockup from "../components/AppMockup";

// Animation variants
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
    transition: { duration: 0.5 },
  },
};

const featureVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: (i) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
    },
  }),
};

const features = [
  {
    icon: "✉️",
    title: "Instant Messaging",
    description:
      "Send and receive messages in real-time with friends and family.",
  },
  {
    icon: "👥",
    title: "Group Chats",
    description:
      "Create groups for team projects, events, or keeping up with friends.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    description: "Your conversations are private and protected.",
  },
  {
    icon: "📱",
    title: "Multi-Device",
    description: "Access your chats seamlessly across all your devices.",
  },
  {
    icon: "🌐",
    title: "Always Connected",
    description: "Stay in touch with your network no matter where you are.",
  },
  {
    icon: "📎",
    title: "Rich Media Sharing",
    description: "Share photos, videos, documents, and more with ease.",
  },
];

const LandingPage = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-primary-foreground"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-foreground">ChatConnect</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <ModeToggle />
          <Link
            to="/login"
            className="text-foreground hover:text-primary transition-colors hidden sm:block"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign up
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 md:gap-12 flex-1"
      >
        <div className="flex-1">
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
          >
            Connect with friends <span className="text-primary">instantly</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg text-muted-foreground max-w-xl"
          >
            Experience seamless communication with our modern messaging
            platform. Share messages, photos, and stay connected with the people
            who matter most.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              to="/register"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-input bg-background text-foreground px-6 py-3 rounded-md text-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Log in
            </Link>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex-1 relative">
          <AppMockup />
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="bg-accent py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12"
          >
            Everything you need to stay connected
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-card p-6 rounded-lg shadow-md border border-border"
                onHoverStart={() => setHovered(index)}
                onHoverEnd={() => setHovered(null)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>

                <motion.div
                  className="w-full h-1 bg-primary/30 mt-4 rounded-full overflow-hidden"
                  initial={{ width: "30%" }}
                  animate={{
                    width: hovered === index ? "100%" : "30%",
                  }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to start chatting?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who are already enjoying our platform.
            Create your account and start connecting with friends today.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-lg font-medium hover:bg-primary/90 inline-block transition-colors"
            >
              Create an Account
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-muted py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
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
              <span className="text-foreground font-semibold">ChatConnect</span>
            </div>

            <div className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} ChatConnect. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
