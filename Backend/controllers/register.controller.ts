import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import User from '../models/User.model'
import Admin from '../models/Admin.model'

// POST /api/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any | void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
    } = req.body

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !role
    ) {
      return res.status(400).json({ message: 'All fields are required.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }

    const fullName = `${firstName} ${lastName}`
    const Model = role === 'admin' ? Admin : User
    const user =
      role === 'admin'
        ? await Admin.findOne({ email })
        : await User.findOne({ email })

    // const existing = await Model.findOne({ email });
    if (user) {
      return res.status(409).json({ message: 'Email already registered.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new Model({
      fullName,
      email,
      password: hashedPassword,
    })

    await newUser.save()

    return res.status(201).json({ message: `${role} registered successfully.` })
  } catch (error) {
    next(error)
  }
}
