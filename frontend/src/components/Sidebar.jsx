import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadMessages,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Fetch users on initial load and sort by updatedAt
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Sort users by updatedAt in descending order to show the most recently updated users at the top
  const sortedUsers = users
    .map((user) => {
      const updatedAtDate = user.updatedAt ? new Date(user.updatedAt) : new Date(0);
      return { ...user, updatedAtDate };
    })
    .sort((a, b) => b.updatedAtDate - a.updatedAtDate); // Sort by updatedAtDate in descending order

  // Filter users based on online status
  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter((user) => onlineUsers.includes(user._id))
    : sortedUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      {/* Contacts list */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-zinc-500 py-4">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {/* Online status indicator */}
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-zinc-900"
                  />
                )}
                {/* Notification badge */}
                {unreadMessages[user._id]?.length > 0 && (
                  <span
                    className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
