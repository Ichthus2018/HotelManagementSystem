import {
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const PersonnelList = ({ personnel, onEdit, onDelete, onChangePassword }) => {
  console.log("Rendering PersonnelList with personnel:", personnel);

  // Dynamic color generator - creates consistent colors for any role string
  const getRoleColor = (role) => {
    // Convert role to string and create a simple hash
    const roleStr = String(role);
    let hash = 0;
    for (let i = 0; i < roleStr.length; i++) {
      hash = roleStr.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick from a wide range of Tailwind color combinations
    const colorOptions = [
      "bg-red-100 text-red-800",
      "bg-orange-100 text-orange-800",
      "bg-amber-100 text-amber-800",
      "bg-yellow-100 text-yellow-800",
      "bg-lime-100 text-lime-800",
      "bg-green-100 text-green-800",
      "bg-emerald-100 text-emerald-800",
      "bg-teal-100 text-teal-800",
      "bg-cyan-100 text-cyan-800",
      "bg-sky-100 text-sky-800",
      "bg-blue-100 text-blue-800",
      "bg-indigo-100 text-indigo-800",
      "bg-violet-100 text-violet-800",
      "bg-purple-100 text-purple-800",
      "bg-fuchsia-100 text-fuchsia-800",
      "bg-pink-100 text-pink-800",
      "bg-rose-100 text-rose-800",
    ];

    const colorIndex = Math.abs(hash) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  const getRoleBadge = (person) => {
    // Use the actual role from the data - whatever it is
    const role = person.role || "user"; // fallback to 'user' if no role
    const colorClass = getRoleColor(role);

    return (
      <span
        className={`px-2 py-1 ${colorClass} text-xs font-medium rounded-full capitalize`}
      >
        {role.toLowerCase()}
      </span>
    );
  };

  return (
    <ul role="list" className="divide-y divide-gray-200">
      {personnel.map((person) => (
        <li
          key={person.id}
          className="group relative p-4 sm:p-6 transition-colors duration-200 hover:bg-blue-50"
        >
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
              <UserCircleIcon className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-800 truncate">
                  {person.auth_users?.email || person.email}
                </h3>
                {getRoleBadge(person)}
              </div>
              <p className="text-sm text-gray-600">
                Member since:{" "}
                {new Date(
                  person.auth_users?.created_at || person.created_at
                ).toLocaleDateString()}
              </p>
            </div>

            <div className="absolute top-4 right-4 flex-shrink-0 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onChangePassword(person)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-blue-100 hover:text-blue-600 transition-colors"
                title="Change Password"
              >
                <KeyIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onEdit(person)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-green-100 hover:text-green-600 transition-colors"
                title="Edit Personnel"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(person)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Delete Personnel"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PersonnelList;
