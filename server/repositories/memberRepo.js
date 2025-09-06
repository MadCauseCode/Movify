import Member from "../models/memberModel.js";

const getAllMembers = () => Member.find();
const findByMemberName = (name) => Member.findOne({ name });
const getMemberById = (id) => Member.findById(id);
const createMember = (obj) => Member.create(obj);
const updateMember = (id, obj) =>
  Member.findByIdAndUpdate(id, obj, { new: true, runValidators: true });
const deleteMember = (id) => Member.findByIdAndDelete(id);

export { getAllMembers, findByMemberName, getMemberById, createMember, updateMember, deleteMember};
