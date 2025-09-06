import User from "../models/userModel.js";

export async function ensureDefaultAdmin() {
  const username = process.env.DEFAULT_ADMIN_USERNAME?.trim();
  const passwordHash = process.env.DEFAULT_ADMIN_HASHED_PASSWORD?.trim();

  if (!username || !passwordHash) {
    console.warn("Skipping admin creation: missing env vars.");
    return;
  }

  const exists = await User.exists({ username });
  if (exists) {
    console.log(` Admin '${username}' already exists.`);
    return;
  }

  await User.create({
    username,
    passwordHash,
    role: "admin",
    mustChangePassword: true,
  });

  console.log(` Admin '${username}' created.`);
}
