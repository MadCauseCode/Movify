import subscriptionModel from "../models/subscriptionModel.js";

export const findAllSubscriptions = () =>
  subscriptionModel.find().populate("memberId").populate("movies.movieId");

export const findSubscriptionById = (id) =>
  subscriptionModel
.findById(id)
.populate("memberId")
.populate("movies.movieId");

export const findAllMemberSubscriptions = (memberId) =>
  subscriptionModel
    .find({ memberId })
    .populate("memberId")
    .populate("movies.movieId");

export const createSubscription = (obj) => subscriptionModel.create(obj);

export const updateSubscription = (id, obj) =>
  subscriptionModel.findByIdAndUpdate(id, obj, {
    new: true,
    runValidators: true,
  });

export const deleteSubscription = (id) =>
  subscriptionModel.findByIdAndDelete(id);


