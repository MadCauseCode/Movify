import User from "../models/userModel.js";

const findByUsername = (username) => User.findOne({ username });
const getUserById = (id) => User.findById(id);
const createUser = (obj) => User.create(obj);
const updateUser = (id, obj) =>
  User.findByIdAndUpdate(id, obj, { new: true, runValidators: true });
const deleteUser = (id) => User.findByIdAndDelete(id);

export {
  findByUsername,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
