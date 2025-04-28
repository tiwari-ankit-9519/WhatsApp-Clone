import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../components/theme-provider";
import { updateProfile, deleteAccount } from "../state/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import {
  Camera,
  User,
  Mail,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Edit,
  X,
} from "lucide-react";

const ProfilePage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const auth = useAuth();
  const { user, logout } = auth;
  const updateUser =
    auth.updateUser || (() => console.log("updateUser not available"));
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profilePic: user?.profilePic || "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePic || "");

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        profilePic: user.profilePic || "",
      });
      setPreviewUrl(user.profilePic || "");
    }
  }, [user]);

  // Reset edit mode on mount
  useEffect(() => {
    setIsEditMode(false);
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: (data) => {
      // Update local user state if updateUser is available
      if (typeof updateUser === "function") {
        updateUser(data);
      } else {
        // If updateUser is not available, just update the local state
        setFormData({
          name: data?.name || formData.name,
          email: data?.email || formData.email,
          profilePic: data?.profilePic || formData.profilePic,
        });
        setPreviewUrl(data?.profilePic || formData.profilePic || "");
      }
      toast.success("Profile updated successfully");
      setIsEditMode(false);
    },
    onError: (error) => {
      console.error("Update profile error:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile"
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      logout();
      navigate("/login");
      toast.success("Your account has been permanently deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete account");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Add name to form data
      formDataToSend.append("name", formData.name);

      // Add profile picture if selected
      if (selectedImage) {
        formDataToSend.append("profilePic", selectedImage);
      }

      updateProfileMutation.mutate(formDataToSend);
    } catch (error) {
      console.error("Error preparing form data:", error);
      toast.error("Error preparing form data");
    }
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Reset form data when canceling edit
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        profilePic: user?.profilePic || "",
      });
      setPreviewUrl(user?.profilePic || "");
      setSelectedImage(null);
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <div
      className={`flex-1 overflow-y-auto ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-3xl mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/chats")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chats
        </Button>

        <Card className={isDark ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </div>
            {!isEditMode && (
              <Button onClick={handleEditToggle} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={previewUrl} alt={user?.name} />
                    <AvatarFallback>
                      <User className="w-16 h-16" />
                    </AvatarFallback>
                  </Avatar>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </div>
                {isEditMode && (
                  <p className="text-sm text-muted-foreground">
                    Click the camera icon to upload a new photo
                  </p>
                )}
              </div>

              <Separator />

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your name"
                      disabled={!isEditMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your email"
                      disabled
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
          {isEditMode && (
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleEditToggle}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className={`mt-6 border-red-500 ${isDark ? "bg-gray-800" : ""}`}>
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
