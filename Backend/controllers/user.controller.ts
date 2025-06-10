import { Request, Response, NextFunction } from "express";
import User from "../models/User.model";

// GET /api/users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();

    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find().skip(skip).limit(limit).select("-password");

    res.status(200).json({
      users,
      totalUsers,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { firstName, lastName, email } = req.body;
    const fullName =
      firstName && lastName ? `${firstName} ${lastName}` : undefined;

    const updateData: any = {};

    if (firstName && lastName) updateData.fullName = fullName;
    if (email) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found." });
    res
      .status(200)
      .json({ updatedUser, message: "User updated successfully." });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/status/:id
export const activateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    user.isActive = !user.isActive;
    const message = `User ${user.isActive ? "activated" : "deactivated"} successfully.`;
    await user.save();
    res.status(200).json({ message: message, user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
};
