import User from "../models/user.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//asyncHandler for avoid try-catch every time
export const RegisterUser = asyncHandler(async (req, res, next) => {
  //get user details
  const { name, email, password } = req.body;

  //validation for not empty
  if ([name, email, password].some((field) => field?.trim() === "")) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  //check already Exist
  const existedUser = await User.findOne({ email });

  if (existedUser) {
    return res.status(400).json({
      success: false,
      message: "User with email already exists",
    });
  }

  //create user object - create
  const user = new User({ name, email, password });

  await user.save();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
  });
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  //validation for not empty
  if ([name, email, password].some((field) => field?.trim() === "")) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  //check if user exists
  const user = await User.findOne({
    $or: [{ email }, { name }],
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid email and name",
    });
  }

  //check if password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return res.status(400).json({
      success: false,
      message: "Invalid password",
    });
  }

  //generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  //save refresh token with user
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      success: true,
      message: "User logged in successfully",
      loggedInUser,
    });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      success: true,
      message: "User logged Out",
    });
});
