/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/state/auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define validation schema with Zod
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must include uppercase, lowercase, and number"
    ),
});

const RegisterForm = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Initialize react-hook-form with zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Registration successful!");
      navigate("/chats");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);

      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data) => {
    // Create FormData object for file upload
    const submitData = new FormData();
    submitData.append("name", data.name);
    submitData.append("email", data.email);
    submitData.append("password", data.password);
    if (profilePic) {
      submitData.append("profilePic", profilePic);
    }

    registerMutation.mutate(submitData);
  };

  return (
    <div className="w-full md:w-1/2 flex justify-center items-center">
      <motion.div
        className={`w-full max-w-md sm:w-[420px] p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-md ${
          theme === "dark"
            ? "bg-gray-900/70 text-white"
            : "bg-white/80 text-gray-900"
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Create Account
          </h2>
          <p
            className={`text-sm sm:text-base ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Join the conversation today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="mb-6 flex flex-col items-center">
            <motion.div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 flex items-center justify-center border-2 ${
                theme === "dark"
                  ? "border-teal-500 bg-gray-800"
                  : "border-teal-600 bg-gray-100"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className={`w-10 h-10 sm:w-12 sm:h-12 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </motion.div>

            <label
              htmlFor="profilePic"
              className={`cursor-pointer text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-full ${
                theme === "dark"
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              Upload Photo
            </label>
            <input
              type="file"
              id="profilePic"
              name="profilePic"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="John Doe"
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700 focus:border-teal-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-teal-600"
              } border focus:ring-2 focus:ring-opacity-50 focus:ring-teal-500 outline-none transition ${
                errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-red-500 text-xs">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700 focus:border-teal-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-teal-600"
              } border focus:ring-2 focus:ring-opacity-50 focus:ring-teal-500 outline-none transition ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-red-500 text-xs">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700 focus:border-teal-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-teal-600"
              } border focus:ring-2 focus:ring-opacity-50 focus:ring-teal-500 outline-none transition ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-red-500 text-xs">
                {errors.password.message}
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-2 sm:py-3 px-4 rounded-lg font-medium text-white mt-4 ${
              isSubmitting || registerMutation.isPending
                ? "bg-gray-500 cursor-not-allowed"
                : theme === "dark"
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-teal-500 hover:bg-teal-600"
            } transition-colors flex justify-center items-center`}
            disabled={isSubmitting || registerMutation.isPending}
          >
            {isSubmitting || registerMutation.isPending ? (
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>

        <div className="mt-5 text-center">
          <p
            className={`text-sm sm:text-base ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className={`font-medium ${
                theme === "dark"
                  ? "text-teal-400 hover:text-teal-300"
                  : "text-teal-600 hover:text-teal-700"
              }`}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
