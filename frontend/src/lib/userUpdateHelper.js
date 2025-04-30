const USER_UPDATED_EVENT = "user-updated";

export const notifyUserUpdated = (userData) => {
  const event = new CustomEvent(USER_UPDATED_EVENT, { detail: userData });

  window.dispatchEvent(event);

  if (userData) {
    localStorage.setItem("user", JSON.stringify(userData));
  }
};

export const addUserUpdateListener = (callback) => {
  const handleEvent = (event) => {
    callback(event.detail);
  };

  window.addEventListener(USER_UPDATED_EVENT, handleEvent);

  return () => {
    window.removeEventListener(USER_UPDATED_EVENT, handleEvent);
  };
};
