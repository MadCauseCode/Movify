const UserCard = ({ user, onDelete, onChangeRole, onEdit }) => {
  const id = user?._id || user?.id;
  const username = String(user?.username ?? "").trim();
  const fullName = String(user?.fullName ?? "").trim();
  const displayName = fullName || username || "Unnamed";

  function getInitials(displayName) {
    if (!displayName || typeof displayName !== "string") return "?";
    const matches = displayName.match(/\b\w/g);
    if (!matches || matches.length === 0) return "?";
    return matches.slice(0, 2).join("").toUpperCase();
  }

  const initials = getInitials(displayName);
  const role = String(user?.role ?? "").toLowerCase();
  const mustChange = !!user?.mustChangePassword;

  const handleDeleteClick = () => {
    if (!onDelete || !id) return;
    const ok = window.confirm(
      `Delete user "${displayName}"? This cannot be undone.`
    );
    if (ok) onDelete(id, user);
  };

  const handleEditClick = () => {
    if (!onEdit || !id) return;
    onEdit(id, user);
    console.log(`Editing user ${displayName}`);
  };

  const isAdmin = role === "admin";
  const currentValue = isAdmin ? "admin" : role || "user";

  const handleRoleChange = (e) => {
    if (!onChangeRole || !id) return;
    const nextRole = e.target.value;
    if (nextRole === currentValue) return;

    // block changes to/from admin in this UI
    if (isAdmin) return;

    onChangeRole(id, nextRole, user);
    console.log(`${displayName} role changed to ${nextRole}`);
  };

  return (
    <div className="user-card">
      <div className="user-card__header">
        <div className="user-card__content">
          <h2 className="user-card__title">{displayName}</h2>
          {username && <div className="user-card__username">@{username}</div>}
          <div className="user-card__badges">
            {mustChange && (
              <span className="badge badge--warn">must change password</span>
            )}
          </div>
        </div>

        <div className="user-card__actions">
          {/* Inline role select */}
          <select
            className="select select-sm select-role"
            value={currentValue}
            onChange={handleRoleChange}
            disabled={isAdmin}
            aria-label="Change role"
            title={
              isAdmin ? "Admin role cannot be changed here" : "Change role"
            }
          >
            {isAdmin ? (
              <option value="admin">admin</option>
            ) : (
              <>
                <option value="user">user</option>
                <option value="moderator">moderator</option>
              </>
            )}
          </select>

          <div className="btn-group">
            <button
              style={{ backgroundColor: "red", color: "white" }}
              className="btn-danger btn-sm"
              onClick={handleDeleteClick}
              aria-label={`Delete ${displayName}`}
              title="Delete user"
            >
              Delete
            </button>
            <button
              style={{ backgroundColor: "orange", color: "white" }}
              className="btn-danger btn-sm"
              onClick={handleEditClick}
              aria-label={`Edit ${displayName}`}
              title="Edit user"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
