/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { useAuthContext } from "../../contexts/AuthContext";
import { useProfile } from "../../hooks/useProfile";
import { useChats } from "../../hooks/useChats";
import { useContacts } from "../../hooks/useContacts";
import { useMessages } from "../../hooks/useMessages";
import { useStarredMessages } from "../../hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  User,
  Mail,
  Edit2,
  Calendar,
  LogOut,
  Trash2,
  Upload,
  X,
  Save,
  UserX,
  RefreshCw,
  Info,
  AtSign,
  ShieldCheck,
  Camera,
  BellOff,
  Star,
  HelpCircle,
  Heart,
  Users2,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount, isUpdateLoading } = useAuthContext();
  const { updateProfile, isUpdating } = useProfile();
  const { chats } = useChats();
  const { contacts } = useContacts();
  const { starredMessages } = useStarredMessages();

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);

  // Form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    gender: user?.gender || "",
    dateOfBirth: user?.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split("T")[0]
      : "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  // Sync form data with user data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
    }
  }, [user]);

  // Calculate age from date of birth
  const getAge = () => {
    if (!user?.dateOfBirth) return null;
    const dob = new Date(user.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate dynamic stats
  const getDynamicStats = () => {
    const messageCount =
      chats?.reduce((total, chat) => {
        // Count the messages in each chat
        return total + (chat.messages?.length || 0);
      }, 0) || 0;

    const groupCount =
      chats?.filter((chat) => chat.type === "GROUP").length || 0;
    const contactCount = contacts?.length || 0;
    const favoriteCount = starredMessages?.length || 0;

    return [
      {
        icon: <MessageSquare className="h-5 w-5" />,
        label: "Messages",
        value:
          messageCount > 999
            ? `${(messageCount / 1000).toFixed(1)}k`
            : messageCount.toString(),
        color: "bg-blue-500/10 text-blue-500",
      },
      {
        icon: <Users2 className="h-5 w-5" />,
        label: "Contacts",
        value: contactCount.toString(),
        color: "bg-purple-500/10 text-purple-500",
      },
      {
        icon: <Star className="h-5 w-5" />,
        label: "Groups",
        value: groupCount.toString(),
        color: "bg-amber-500/10 text-amber-500",
      },
      {
        icon: <Heart className="h-5 w-5" />,
        label: "Favorites",
        value: favoriteCount.toString(),
        color: "bg-rose-500/10 text-rose-500",
      },
    ];
  };

  // Get the dynamic stats
  const stats = getDynamicStats();

  // Handle file selection for profile picture
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing selected profile picture
  const handleRemoveImage = () => {
    setProfilePic(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle changes to profile form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle gender selection
  const handleGenderChange = (value) => {
    setProfileData((prev) => ({ ...prev, gender: value }));
  };

  // Handle profile update submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = {
      name: profileData.name,
      bio: profileData.bio,
      gender: profileData.gender || undefined,
      dateOfBirth: profileData.dateOfBirth || undefined,
      profilePic: profilePic,
    };

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setProfilePic(null);
      setPreviewUrl(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling edit mode
  const handleCancel = () => {
    setIsEditing(false);
    setProfilePic(null);
    setPreviewUrl(null);
    // Reset form to current user data
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
      });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Page animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Profile</h2>
        </div>

        {!isEditing ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 gap-1"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit your profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground px-3 gap-1"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={loading || isUpdating || isUpdateLoading}
              className="px-3 gap-1"
            >
              {loading || isUpdating || isUpdateLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <motion.div
          className="max-w-4xl mx-auto p-4 sm:p-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Profile Header Section */}
          <motion.div
            className="flex flex-col items-center mb-8"
            variants={itemVariants}
          >
            <div className="relative mb-4 group">
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/20 shadow-xl">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={user?.name} />
                ) : (
                  <>
                    <AvatarImage src={user?.profilePic} alt={user?.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>

              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera className="h-5 w-5" />
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Change profile picture</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {profilePic && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="h-10 w-10 rounded-full"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove selected image</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
              <p className="text-muted-foreground flex items-center justify-center gap-1">
                <AtSign className="h-4 w-4" />
                {user?.email}
              </p>
              {user?.online ? (
                <div className="flex items-center justify-center gap-1.5 text-sm mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-500 font-medium">Online Now</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-sm mt-2 text-muted-foreground">
                  <span>
                    Last active{" "}
                    {user?.lastSeen
                      ? formatDistanceToNow(new Date(user.lastSeen), {
                          addSuffix: true,
                        })
                      : "recently"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
            variants={itemVariants}
          >
            {stats.map((stat, index) => (
              <Card key={index} className="border border-border/50">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className={`${stat.color} p-2 rounded-full mb-2`}>
                    {stat.icon}
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Tabs Section */}
          <motion.div className="mb-6" variants={itemVariants}>
            <Tabs
              defaultValue="personal"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger
                  value="personal"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>Personal Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Account</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Personal Information
                          </CardTitle>
                          <CardDescription>
                            Update your personal details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={profileData.name}
                              onChange={handleChange}
                              placeholder="Your full name"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              value={profileData.email}
                              placeholder="Your email address"
                              disabled
                              className="bg-muted/50"
                            />
                            <p className="text-xs text-muted-foreground">
                              Email address cannot be changed
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                              value={profileData.gender}
                              onValueChange={handleGenderChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              value={profileData.dateOfBirth}
                              onChange={handleChange}
                              max={
                                new Date(
                                  new Date().setFullYear(
                                    new Date().getFullYear() - 13
                                  )
                                )
                                  .toISOString()
                                  .split("T")[0]
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              You must be at least 13 years old
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bio">About Me</Label>
                            <Textarea
                              id="bio"
                              name="bio"
                              value={profileData.bio}
                              onChange={handleChange}
                              placeholder="Tell others a bit about yourself..."
                              rows={4}
                              maxLength={500}
                            />
                            <div className="flex justify-end">
                              <span className="text-xs text-muted-foreground">
                                {profileData.bio ? profileData.bio.length : 0}
                                /500
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="viewing"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <Card className="border-border/50 overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0 p-0">
                          <div className="border-t border-border/50 py-3 px-6 bg-muted/20 flex items-center">
                            <div className="flex items-center gap-3 flex-1">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="text-sm font-medium">
                                  Full Name
                                </h3>
                                <p className="text-sm">{user?.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-border/50 py-3 px-6 flex items-center">
                            <div className="flex items-center gap-3 flex-1">
                              <Mail className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="text-sm font-medium">
                                  Email Address
                                </h3>
                                <p className="text-sm break-all">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-border/50 py-3 px-6 bg-muted/20 flex items-center">
                            <div className="flex items-center gap-3 flex-1">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="text-sm font-medium">
                                  Date of Birth
                                </h3>
                                <p className="text-sm">
                                  {user?.dateOfBirth
                                    ? formatDate(user.dateOfBirth)
                                    : "Not specified"}
                                </p>
                                {getAge() && (
                                  <p className="text-xs text-muted-foreground">
                                    {getAge()} years old
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-border/50 py-3 px-6 flex items-center">
                            <div className="flex items-center gap-3 flex-1">
                              <Info className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="text-sm font-medium">Gender</h3>
                                <p className="text-sm">
                                  {user?.gender === "MALE"
                                    ? "Male"
                                    : user?.gender === "FEMALE"
                                    ? "Female"
                                    : user?.gender === "OTHER"
                                    ? "Other"
                                    : "Not specified"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">About Me</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {user?.bio ? (
                            <p className="text-sm whitespace-pre-wrap">
                              {user.bio}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No bio provided yet.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="account">
                <div className="space-y-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Account Settings
                      </CardTitle>
                      <CardDescription>
                        Manage your account preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border-t border-border/50 py-3 px-6 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-medium">
                                Notifications
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Manage notification settings
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                      <div className="border-t border-border/50 py-3 px-6 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <UserX className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-medium">
                                Blocked Users
                              </h3>
                              <Link
                                to="/contacts/find"
                                className="text-xs text-muted-foreground"
                              >
                                Manage blocked contacts
                              </Link>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                      <div className="border-t border-border/50 py-3 px-6 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="text-sm font-medium">
                                Help & Support
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Get assistance with your account
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">
                        Danger Zone
                      </CardTitle>
                      <CardDescription className="text-destructive/70">
                        Irreversible account actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setShowLogoutConfirm(true)}
                        >
                          <LogOut className="h-4 w-4 mr-2 text-muted-foreground" />
                          Logout
                        </Button>

                        <Button
                          variant="destructive"
                          className="w-full justify-start"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <p>Account created: {formatDate(user?.createdAt)}</p>
                        <p>Last updated: {formatDate(user?.updatedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout from your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProfilePage;
