/* eslint-disable no-unused-vars */
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "@/state/auth";
import toast from "react-hot-toast";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const queryClient = useQueryClient();

  const { mutate, error, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success("Login Successful");
      navigate("/chats");
      queryClient.invalidateQueries(["user"]);
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      mutate(data);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  const isLoading = isPending;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
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

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:pr-0 md:pl-8 lg:pl-10 z-10">
      <motion.div
        className={`w-full sm:w-[400px] p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-md ${
          isDark ? "bg-gray-900/70 text-white" : "bg-white/80 text-gray-900"
        }`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back</h1>
          <p
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Sign in to continue to WhatsApp
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <motion.div variants={itemVariants}>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-1.5 ${
                isDark ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <div className="relative">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                } ${errors.email ? "text-red-400" : ""}`}
              >
                <Mail size={20} />
              </div>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`w-full h-12 px-4 py-3 pl-12 rounded-lg ${
                  isDark
                    ? "bg-gray-800 text-white border-gray-700 focus:border-teal-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-teal-600"
                } border focus:ring-2 focus:ring-opacity-50 focus:ring-teal-500 outline-none transition ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                {...register("email")}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-400 block mt-1"
              >
                {errors.email.message}
              </motion.span>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className={`text-xs font-medium ${
                  isDark
                    ? "text-teal-400 hover:text-teal-300"
                    : "text-teal-600 hover:text-teal-700"
                }`}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                } ${errors.password ? "text-red-400" : ""}`}
              >
                <Lock size={20} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full h-12 px-4 py-3 pl-12 pr-12 rounded-lg ${
                  isDark
                    ? "bg-gray-800 text-white border-gray-700 focus:border-teal-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-teal-600"
                } border focus:ring-2 focus:ring-opacity-50 focus:ring-teal-500 outline-none transition ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                {...register("password")}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                disabled={isLoading}
              />
              <button
                type="button"
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                  isDark
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-400 block mt-1"
              >
                {errors.password.message}
              </motion.span>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="pt-2">
            <motion.button
              type="submit"
              className={`w-full h-12 px-4 rounded-lg font-medium text-white ${
                isLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : isDark
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-teal-500 hover:bg-teal-600"
              } transition-colors flex justify-center items-center`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <motion.div
                    className="h-5 w-5 border-2 border-white border-r-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-2">Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mt-5">
            <p className={isDark ? "text-gray-300" : "text-gray-600"}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className={`font-medium ${
                  isDark
                    ? "text-teal-400 hover:text-teal-300"
                    : "text-teal-600 hover:text-teal-700"
                }`}
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </form>

        <motion.div
          variants={itemVariants}
          className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 text-center"
        >
          <p
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            By continuing, you agree to our{" "}
            <a
              href="#"
              className={`${
                isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className={`${
                isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
