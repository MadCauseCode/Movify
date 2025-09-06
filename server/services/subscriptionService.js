import {
  findSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  findAllMemberSubscriptions
} from "../repositories/subscriptionRepo.js";

import Subscription from "../models/subscriptionModel.js";

export const getAllSubscriptions = async () => {
  return Subscription.find()
    .populate("memberId", "name email city") 
    .populate("movies.movieId", "name year"); 
};

export const getSubscriptionById = async (id) => {
  try {
    return await findSubscriptionById(id);
  } catch (error) {
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
};

export const addSubscription = async (subscriptionData) => {
  try {
    return await createSubscription(subscriptionData);
  } catch (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
};

export const modifySubscription = async (id, updateData) => {
  try {
    return await updateSubscription(id, updateData);
  } catch (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
};

export const removeSubscription = async (id) => {
  try {
    return await deleteSubscription(id);
  } catch (error) {
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
};

export const getAllMemberSubscriptions = async (memberId) => {
  try {
    return await findAllMemberSubscriptions(memberId);
  } catch (error) {
    throw new Error(`Failed to fetch subscriptions for member: ${error.message}`);
  }
};


