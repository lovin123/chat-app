import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: new Set(),
  search: "",
  setSearch: (search) => {
    set({ search });
    const { selectedUser } = get();
    if (selectedUser) {
      get().getMessages(selectedUser._id);
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const { search } = get();
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await axiosInstance.get(`/messages/${userId}${queryParams}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  initializeSocketEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("userTyping", (userId) => {
      set((state) => ({
        typingUsers: new Set([...state.typingUsers, userId]),
      }));
    });

    socket.on("userStoppedTyping", (userId) => {
      set((state) => {
        const newTypingUsers = new Set(state.typingUsers);
        newTypingUsers.delete(userId);
        return { typingUsers: newTypingUsers };
      });
    });
  },

  emitTyping: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    let typingTimeout = null;
    if (!socket || !selectedUser || !authUser) return;

    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Emit typing event
    socket.emit("typing", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });

    // Set new timeout for stop typing
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });
      typingTimeout = null;
    }, 1000);
  },

  cleanup: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("newMessage");
  },
}));
