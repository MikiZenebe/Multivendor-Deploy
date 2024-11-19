const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const uuid = require("uuid").v4;
const Verification = require("../models/emailVerificationModel");

dotenv.config();

let transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: "465",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

const sendVerificationEmail = async (user, res) => {
  const { _id, email, name } = user;

  const token = _id + uuid();

  const link = `${process.env.APP_URL}/` + "api/verify/" + _id + "/" + token;

  //   mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div
    style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
    <h3 style="color: #ea4d1b">Please verify your email address</h3>
    <hr>
    <h4>Hi ${name},</h4>
    <p>
        Please verify your email address so we can know that it's really you.
        <br>
    <p>This link <b>expires in 1 hour</b></p>
    <br>
    <a href=${link}
        style="color: #fff; padding: 14px; text-decoration: none; background-color: #ea4d1b;  border-radius: 8px; font-size: 18px;">Verify
        Email Address</a>
    </p>
    <div style="margin-top: 20px;">
        <h5>Best Regards</h5>
        <h5>KeHager Bet - MultiVendor</h5>
    </div>
</div>`,
  };

  try {
    const salt = await bcrypt.genSalt(10);

    const hashedToken = await bcrypt.hash(token, salt);

    const newVerifiedEmail = await Verification.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    if (newVerifiedEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING",
            message:
              "Verification email has been sent to your account. Check your email for further instructions.",
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(404).json({ message: "Something went wrong" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};

const sendSellerVerificationEmail = async (user, res) => {
  const { _id, email, name } = user;

  const token = _id + uuid();

  const link =
    `${process.env.APP_URL}/` + "api/seller-verify/" + _id + "/" + token;

  //   mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div
    style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
    <h3 style="color: #ea4d1b">Please verify your email address</h3>
    <hr>
    <h4>Hi ${name},</h4>
    <p>
        Please verify your email address so we can know that it's really you.
        <br>
    <p>This link <b>expires in 1 hour</b></p>
    <br>
    <a href=${link}
        style="color: #fff; padding: 14px; text-decoration: none; background-color: #ea4d1b;  border-radius: 8px; font-size: 18px;">Verify
        Email Address</a>
    </p>
    <div style="margin-top: 20px;">
        <h5>Best Regards</h5>
        <h5>KeHager Bet - MultiVendor</h5>
    </div>
</div>`,
  };

  try {
    const salt = await bcrypt.genSalt(10);

    const hashedToken = await bcrypt.hash(token, salt);

    const newVerifiedEmail = await Verification.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    if (newVerifiedEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING",
            message:
              "Verification email has been sent to your account. Check your email for further instructions.",
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(404).json({ message: "Something went wrong" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Something went wrong" });
  }
};

// New method to send the purchase confirmation email
const sendPurchaseConfirmationEmail = async (user, order, res) => {
  const { email, name } = user;
  const { _id, price, delivery_status } = order;

  // Prepare the email content
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Order Confirmation - Successful Purchase",
    html: `<div
        style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
        <h3 style="color: #4CAF50">Your Order Has Been Successfully Placed!</h3>
        <hr>
        <h4>Hello ${name},</h4>
        <p>
            We are happy to inform you that your order has been successfully placed. Here are the details:
        </p>
        <p><b>Order ID:</b> ${_id}</p>
        <p><b>Total Price:</b> $${price}</p>
        <p><b>Status:</b> ${delivery_status}</p>
        <br>
        <p>Thank you for shopping with us! Your order will be processed and shipped soon.</p>
        <div style="margin-top: 20px;">
            <h5>Best Regards</h5>
            <h5>KeHager Bet - MultiVendor</h5>
        </div>
    </div>`,
  };

  // Try sending the email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
    // Respond with a success message
    res.status(200).send({
      success: "SUCCESS",
      message: "Order confirmed and confirmation email sent to the customer.",
    });
  } catch (error) {
    console.log("Error sending email:", error);
    // Handle the error
    res.status(500).json({ message: "Error sending confirmation email" });
  }
};

const sendStatusUpdateEmail = async (user, order, status, res) => {
  const { email, name } = user;
  const { _id, price } = order;

  // Prepare the email content based on the status change
  const statusMessages = {
    pending:
      "Your order is now in 'Pending' status. We're preparing it for shipping.",
    placed: "Your order has been successfully placed. It's in 'Placed' status.",
    shipped: "Your order has been shipped and is on its way to you!",
    delivered:
      "Your order has been delivered. We hope you enjoy your purchase!",
    cancelled:
      "Your order has been cancelled. Please contact us if you have any questions.",
  };

  // Ensure that we have a message for the given status
  const statusMessage =
    statusMessages[status] || "Your order status has been updated.";

  // Mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: `Order Status Update - ${
      status.charAt(0).toUpperCase() + status.slice(1)
    }`,
    html: `<div
      style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
      <h3 style="color: #4CAF50">Your Order Status has been updated!</h3>
      <hr>
      <h4>Hello ${name},</h4>
      <p>
          We wanted to let you know that the status of your order <b>${_id}</b> has been updated to:
      </p>
      <p><b>Status:</b> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
      <p><b>Total Price:</b> $${price}</p>
      <p>${statusMessage}</p>
      <br>
      <p>Thank you for shopping with us!</p>
      <div style="margin-top: 20px;">
          <h5>Best Regards</h5>
          <h5>KeHager Bet - MultiVendor</h5>
      </div>
  </div>`,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Order status update email sent to ${email}`);
  } catch (error) {
    console.log("Error sending status update email:", error);
    res.status(500).json({ message: "Error sending status update email" });
  }
};

module.exports = {
  sendVerificationEmail,
  sendSellerVerificationEmail,
  sendPurchaseConfirmationEmail,
  sendStatusUpdateEmail,
};
