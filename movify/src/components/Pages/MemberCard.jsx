const MemberCard = ({ member }) => {
  const name = (member?.name ?? member?.fullName ?? "Unnamed")
    .toString()
    .trim();
  const email = (member?.email ?? "").toString().trim();
  const city =
    (member?.city ?? member?.address?.city ?? "—").toString().trim() || "—";

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join("") || "?";

  return (
    <>
      <div
        className="member-item"
        style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            aria-label="initials avatar"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#f2f2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              color: "#666",
            }}
          >
            {initials}
          </div>

          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{name}</h2>
        </div>

        <p style={{ margin: "0 0 6px", color: "#555" }}>
          Email:{" "}
          {email ? (
            <a style={{ color: "#3366ee", textDecoration: "none" }}>{email}</a>
          ) : (
            "—"
          )}
        </p>
        <p style={{ margin: 0, color: "#555" }}>City: {city}</p>
      </div>
    </>
  );
};

export default MemberCard;
