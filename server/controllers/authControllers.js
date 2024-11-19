const adminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const sellerCustomerModel = require("../models/chat/sellerCustomerModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const { responseReturn } = require("../utils/response");
const { createToken } = require("../utils/tokenCreate");
const Verification = require("../models/emailVerificationModel");
const {
  sendVerificationEmail,
  sendSellerVerificationEmail,
} = require("../utils/sendEmail");
class authControllers {
  admin_login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = await adminModel.findOne({ email }).select("+password");
      if (admin) {
        const match = await bcrypt.compare(password, admin.password);
        if (match) {
          const token = await createToken({
            id: admin.id,
            role: admin.role,
          });
          res.cookie("accessToken", token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          responseReturn(res, 200, { token, message: "Login success" });
        } else {
          responseReturn(res, 404, { error: "Password wrong" });
        }
      } else {
        responseReturn(res, 404, { error: "Email not found" });
      }
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  admin_register = async (req, res) => {
    const { email, name, password } = req.body;
    try {
      const getUser = await adminModel.findOne({ email });
      if (getUser) {
        responseReturn(res, 404, { error: "Email alrady exit" });
      } else {
        const admin = await adminModel.create({
          name,
          email,
          password: await bcrypt.hash(password, 10),
        });

        const token = await createToken({ id: admin.id, role: admin.role });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        responseReturn(res, 201, { token, message: "register success" });
      }
    } catch (error) {
      responseReturn(res, 500, { error: "Internal server error" });
    }
  };

  google = async (req, res, next) => {
    const { name, email, image } = req.body;

    try {
      const user = await sellerModel.findOne({ email });

      if (user) {
        const token = await createToken({
          id: user._id,
          name: user.name,
          email: user.email,
          method: user.method,
        });
        const { password, ...rest } = user._doc;

        res.cookie("accessToken", token, {
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

        const createSeller = await sellerModel.create({
          name: name.trim(),
          email: email.trim(),
          password: hashedPassword,
          method: "google",
          verified: true,
          image: image,
        });

        await sellerCustomerModel.create({
          myId: createSeller.id,
        });

        const token = await createToken({
          id: createSeller._id,
          name: createSeller.name,
          email: createSeller.email,
          method: createSeller.method,
        });
        res.cookie("accessToken", token, {
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

  seller_login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const seller = await sellerModel.findOne({ email }).select("+password");

      if (seller) {
        if (!seller) {
          responseReturn(res, 404, { error: "Email already exits" });
        }

        if (!seller?.verified) {
          next(
            "User email is not verified. Check your email account and verify your email"
          );
          return;
        }
      }

      const match = await bcrypt.compare(password, seller.password);
      if (match) {
        const token = await createToken({
          id: seller.id,
          name: seller.name,
          email: seller.email,
          method: seller.method,
          isVerified: seller.verified,
        });
        res.cookie("accessToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
          success: true,
          message: "Login successfully",
          seller,
          token,
        });
      }
    } catch (error) {
      console.log("Error in login ", error);
      res.status(400).json({ success: false, message: error.message });
    }
  };

  seller_register = async (req, res) => {
    const { email, name, password } = req.body;
    try {
      if (!email || !password || !name) {
        throw new Error("All fields are required");
      }

      const seller = await sellerModel.findOne({ email });

      if (seller) {
        responseReturn(res, 404, { error: "Email already exits" });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newSeller = await sellerModel.create({
          name,
          email,
          password: hashedPassword,
          method: "manually",
          shopInfo: {},
        });
        sendSellerVerificationEmail(newSeller, res);
        await sellerCustomerModel.create({
          myId: newSeller.id,
        });
        const token = await createToken({
          id: newSeller.id,
          name: newSeller.name,
          email: newSeller.email,
          method: newSeller.method,
        });
        res.cookie("accessToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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
              sellerModel
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
                sellerModel
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

  getUser = async (req, res) => {
    const { id, role } = req;

    try {
      if (role === "admin") {
        const user = await adminModel.findById(id);
        responseReturn(res, 200, { userInfo: user });
      } else {
        const seller = await sellerModel.findById(id);
        responseReturn(res, 200, { userInfo: seller });
      }
    } catch (error) {
      responseReturn(res, 500, { error: "Internal server error" });
    }
  };

  profile_image_upload = async (req, res) => {
    const { id } = req;
    const form = formidable({ multiples: true });
    form.parse(req, async (err, _, files) => {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      const { image } = files;
      try {
        const result = await cloudinary.uploader.upload(image.filepath, {
          folder: "profile",
        });
        if (result) {
          await sellerModel.findByIdAndUpdate(id, {
            image: result.url,
          });
          const userInfo = await sellerModel.findById(id);
          responseReturn(res, 201, {
            message: "image upload success",
            userInfo,
          });
        } else {
          responseReturn(res, 404, { error: "image upload failed" });
        }
      } catch (error) {
        //console.log(error)
        responseReturn(res, 500, { error: error.message });
      }
    });
  };

  profile_info_add = async (req, res) => {
    const { division, district, shopName, sub_district } = req.body;
    const { id } = req;

    try {
      await sellerModel.findByIdAndUpdate(id, {
        shopInfo: {
          shopName,
          division,
          district,
          sub_district,
        },
      });
      const userInfo = await sellerModel.findById(id);
      responseReturn(res, 201, {
        message: "Profile info add success",
        userInfo,
      });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  logout = async (req, res) => {
    try {
      res.clearCookie("customerToken"),
        res
          .status(200)
          .json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };
}
module.exports = new authControllers();
