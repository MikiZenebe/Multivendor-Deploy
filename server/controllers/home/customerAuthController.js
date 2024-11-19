const customerModel = require("../../models/customerModel");
const { responseReturn } = require("../../utils/response");
const { createToken } = require("../../utils/tokenCreate");
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel");
const bcrypt = require("bcrypt");
const {
  sendVerificationEmail,
  resetPasswordLink,
} = require("../../utils/sendEmail");
const Verification = require("../../models/emailVerificationModel");

class customerAuthController {
  customer_register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
      if (!email || !password || !name) {
        throw new Error("All fields are required");
      }

      const customer = await customerModel.findOne({ email });
      if (customer) {
        responseReturn(res, 404, { error: "Email already exits" });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const createCustomer = await customerModel.create({
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          method: "manually",
        });
        sendVerificationEmail(createCustomer, res);
        await sellerCustomerModel.create({
          myId: createCustomer.id,
        });

        const token = await createToken({
          id: createCustomer.id,
          name: createCustomer.name,
          email: createCustomer.email,
          method: createCustomer.method,
        });
        res.cookie("customerToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: error.message });
    }
  };

  customer_login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const customer = await customerModel
        .findOne({ email })
        .select("+password");

      if (customer) {
        if (!customer) {
          next("Invalid email or password");
          return;
        }

        if (!customer?.verified) {
          next(
            "User email is not verified. Check your email account and verify your email"
          );
          return;
        }

        const match = await bcrypt.compare(password, customer.password);
        if (match) {
          const token = await createToken({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            method: customer.method,
            isVerified: customer.verified,
          });
          res.cookie("customerToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          res.status(201).json({
            success: true,
            message: "Login successfully",
            customer,
            token,
          });
        } else {
          responseReturn(res, 404, { error: "Password wrong" });
        }
      } else {
        responseReturn(res, 404, { error: "Email not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: error.message });
    }
  };

  google = async (req, res, next) => {
    const { name, email, image } = req.body;

    try {
      const user = await customerModel.findOne({ email });

      if (user) {
        const token = await createToken({
          id: user._id,
          name: user.name,
          email: user.email,
          method: user.method,
        });
        const { password, ...rest } = user._doc;

        res.cookie("customerToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
          success: true,
          message: "Success",
          rest,
          token,
        });
      } else {
        const genPassword =
          Math.random().toString(36).slice(-8) +
          Math.random().toString(36).slice(-8);

        const hashedPassword = bcrypt.hashSync(genPassword, 10);

        const createCustomer = await customerModel.create({
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          method: "google",
          verified: true,
        });

        await sellerCustomerModel.create({
          myId: createCustomer.id,
        });

        const token = await createToken({
          id: createCustomer._id,
          name: createCustomer.name,
          email: createCustomer.email,
          method: createCustomer.method,
        });
        res.cookie("customerToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  verify_email = async (req, res) => {
    const { userId, token } = req.params;

    try {
      const result = await Verification.findOne({ userId });

      if (result) {
        const { expiresAt, token: hashedToken } = result;

        // token has expires
        if (expiresAt < Date.now()) {
          Verification.findOneAndDelete({ userId })
            .then(() => {
              customerModel
                .findOneAndDelete({ _id: userId })
                .then(() => {
                  const message = "Verification token has expired.";
                  res.redirect(`/api/verified?status=error&message=${message}`);
                })
                .catch((err) => {
                  res.redirect(`/api/verified?status=error&message=`);
                });
            })
            .catch((error) => {
              console.log(error);
              res.redirect(`/api/verified?message=`);
            });
        } else {
          //token valid
          bcrypt
            .compare(token, hashedToken)
            .then((isMatch) => {
              if (isMatch) {
                customerModel
                  .findOneAndUpdate({ _id: userId }, { verified: true })
                  .then(() => {
                    Verification.findOneAndDelete({ userId }).then(() => {
                      const message = "Email Verified Successfully";
                      res.redirect(
                        `/api/verified?status=success&message=${message}`
                      );
                    });
                  })
                  .catch((err) => {
                    console.log(err);
                    const message = "Verification failed or link is invalid";
                    res.redirect(
                      `/api/verified?status=error&message=${message}`
                    );
                  });
              } else {
                // invalid token
                const message = "Verification failed or link is invalid";
                res.redirect(`/api/verified?status=error&message=${message}`);
              }
            })
            .catch((err) => {
              console.log(err);
              res.redirect(`/api/verified?message=`);
            });
        }
      } else {
        const message = "Invalid verification link. Try again later.";
        res.redirect(`/api/verified?status=error&message=${message}`);
      }
    } catch (err) {
      console.log(err);
      res.redirect(`/api/verified?message=`);
    }
  };

  request_password = async (req, res) => {
    const { email } = req.body;

    try {
      const customer = await customerModel.findOne({ email });

      if (!customer) {
        return res.status(404).json({
          status: "FAILED",
          message: "Email address not found.",
        });
      }

      const existingRequest = await PassResetModel.findOne({ email });
      if (existingRequest) {
        if (existingRequest.expiresAt > Date.now()) {
          return res.status(201).json({
            status: "PENDING",
            message: "Reset password link has already been sent tp your email.",
          });
        }
        await PassResetModel.findOneAndDelete({ email });
      }
      await resetPasswordLink(customer, res);
    } catch (error) {
      console.log("Error in forgotPassword ", error);
      res.status(400).json({ success: false, message: error.message });
    }
  };

  reset_Password = async (req, res) => {
    const { userId, token } = req.params;

    try {
      // find record
      const user = await customerModel.findById(userId);

      if (!user) {
        const message = "Invalid password reset link. Try again";
        res.redirect(`/api/resetpassword?status=error&message=${message}`);
      }

      const resetPassword = await PassResetModel.findOne({ userId });

      if (!resetPassword) {
        const message = "Invalid password reset link. Try again";
        return res.redirect(
          `/api/resetpassword?status=error&message=${message}`
        );
      }

      const { expiresAt, token: resetToken } = resetPassword;

      if (expiresAt < Date.now()) {
        const message = "Reset Password link has expired. Please try again";
        res.redirect(`/api/resetpassword?status=error&message=${message}`);
      } else {
        const isMatch = await bcrypt.compare(token, resetToken);

        if (!isMatch) {
          const message = "Invalid reset password link. Please try again";
          res.redirect(`/api/resetpassword?status=error&message=${message}`);
        } else {
          res.redirect(`/api/resetpassword?type=reset&id=${userId}`);
        }
      }
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: error.message });
    }
  };

  change_Password = async (req, res, next) => {
    try {
      const { userId, password } = req.body;

      const hashedpassword = await bcrypt.hash(password);

      const user = await customerModel.findByIdAndUpdate(
        { _id: userId },
        { password: hashedpassword }
      );

      if (user) {
        await PassResetModel.findOneAndDelete({ userId });

        res.status(200).json({
          ok: true,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: error.message });
    }
  };

  customer_logout = async (req, res) => {
    res.clearCookie("customerToken"),
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
  };
}

module.exports = new customerAuthController();
