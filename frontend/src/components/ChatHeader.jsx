import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallback } from "react";
import debounce from "lodash/debounce";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, search, setSearch } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Debounce the search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Update the input value immediately for UI responsiveness
    e.target.value = value;
    // Debounce the actual search
    debouncedSearch(value);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search messages..."
          className="input input-bordered input-sm w-48"
          defaultValue={search}
          onChange={handleSearchChange}
        />

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
