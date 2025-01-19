import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  unreadMessages: {}, // Initialize as an object
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Fetch users and sort them by updatedAt (descending)
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      // Ensure users have an updatedAt property and sort by updatedAt
      const sortedUsers = res.data
        .map((user) => ({
          ...user,
          updatedAt: user.updatedAt || new Date(0).toISOString(),
        }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      set({ users: sortedUsers });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // Clear unread messages for the selected user
      const unreadMessages = { ...get().unreadMessages };
      delete unreadMessages[userId];
      set({ unreadMessages });

      // Update the user's updatedAt in the users list
      set((state) => {
        const updatedUsers = state.users.map((user) =>
          user._id === userId
            ? { ...user, updatedAt: new Date().toISOString() }
            : user
        );
        const sortedUsers = updatedUsers.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        return { users: sortedUsers };
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message and update the sender's updatedAt
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });

      // Update the user's updatedAt in the users list
      set((state) => {
        const updatedUsers = state.users.map((user) =>
          user._id === selectedUser._id
            ? { ...user, updatedAt: new Date().toISOString() }
            : user
        );
        const sortedUsers = updatedUsers.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        return { users: sortedUsers };
      });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Subscribe to incoming messages
  subscribeToMessages: () => {
    const { unreadMessages, selectedUser } = get();
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isFromSelectedUser = newMessage.senderId === selectedUser?._id;

      if (isFromSelectedUser) {
        // Append to current chat messages if the sender is the selected user
        set({ messages: [...get().messages, newMessage] });
      } else {
        // Add the message to unreadMessages for the respective user
        const updatedUnreadMessages = {
          ...unreadMessages,
          [newMessage.senderId]: [
            ...(unreadMessages[newMessage.senderId] || []),
            newMessage,
          ],
        };
        set({ unreadMessages: updatedUnreadMessages });

        console.log("Updated unreadMessages:", updatedUnreadMessages);
      }

      // Update the user's updatedAt in the users list
      set((state) => {
        const updatedUsers = state.users.map((user) =>
          user._id === newMessage.senderId
            ? { ...user, updatedAt: new Date().toISOString() }
            : user
        );
        const sortedUsers = updatedUsers.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        return { users: sortedUsers };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Set the selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
