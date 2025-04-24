/* eslint-disable no-unused-vars */
import { cn } from "@/lib/utils";
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
      const token = data.token;
      localStorage.setItem("token", token);
      toast.success("Login Successful");
      navigate("/");
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
      boxShadow: "0 10px 25px -5px rgba(255, 255, 255, 0.3)",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 z-10">
      <motion.div
        className="w-full max-w-md bg-white/10 dark:bg-gray-900/20 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/20 dark:border-white/10 shadow-xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="space-y-2 text-center mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-sm text-white/70">
            Sign in to continue to WhatsApp
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="email"
                className={cn(
                  "text-sm font-medium transition-colors",
                  focusedField === "email" ? "text-white" : "text-white/80"
                )}
              >
                Email
              </label>
              {errors.email && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-red-300"
                >
                  {errors.email.message}
                </motion.span>
              )}
            </div>
            <div className="relative">
              <div
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200",
                  focusedField === "email" ? "text-white" : "text-white/60",
                  errors.email && "text-red-300"
                )}
              >
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={cn(
                  "h-12 w-full pl-10 pr-4 rounded-xl bg-white/10 border-2 border-white/20 focus:outline-none transition-all duration-200 text-white placeholder:text-white/40",
                  focusedField === "email"
                    ? "border-white/40 ring-2 ring-white/20"
                    : "",
                  errors.email ? "border-red-400/50 ring-2 ring-red-400/20" : ""
                )}
                {...register("email", {
                  onBlur: () => setFocusedField(null),
                })}
                onFocus={() => setFocusedField("email")}
                disabled={isLoading}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className={cn(
                  "text-sm font-medium transition-colors",
                  focusedField === "password" ? "text-white" : "text-white/80"
                )}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-white/90 hover:text-white hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200",
                  focusedField === "password" ? "text-white" : "text-white/60",
                  errors.password && "text-red-300"
                )}
              >
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={cn(
                  "h-12 w-full pl-10 pr-10 rounded-xl bg-white/10 border-2 border-white/20 focus:outline-none transition-all duration-200 text-white placeholder:text-white/40",
                  focusedField === "password"
                    ? "border-white/40 ring-2 ring-white/20"
                    : "",
                  errors.password
                    ? "border-red-400/50 ring-2 ring-red-400/20"
                    : ""
                )}
                {...register("password", {
                  onBlur: () => setFocusedField(null),
                })}
                onFocus={() => setFocusedField("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-red-300 block"
              >
                {errors.password.message}
              </motion.span>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              className="relative overflow-hidden flex w-full items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white h-12 text-base font-medium shadow-lg hover:bg-white/30 transition-all duration-300 border border-white/40 disabled:opacity-70 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center relative z-10">
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
                <div className="flex items-center relative z-10">
                  <span className="mr-2">Sign In</span>
                  <motion.div
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
              )}
            </motion.button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="text-center text-sm mt-6"
          >
            <span className="text-white/70">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-white font-medium hover:underline"
              >
                Sign up
              </Link>
            </span>
          </motion.div>
        </form>

        <motion.div
          variants={itemVariants}
          className="mt-8 pt-6 border-t border-white/10 text-center"
        >
          <p className="text-xs text-white/50">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-white/80 hover:text-white hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-white/80 hover:text-white hover:underline"
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
