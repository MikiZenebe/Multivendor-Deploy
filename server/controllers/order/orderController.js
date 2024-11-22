const authOrderModel = require("../../models/authOrder");
const customerOrder = require("../../models/customerOrder");
const cardModel = require("../../models/cardModel");
const customerModel = require("../../models/customerModel");
const myShopWallet = require("../../models/myShopWallet");
const sellerWallet = require("../../models/sellerWallet");
const productModel = require("../../models/productModel");
const axios = require("axios");
const crypto = require("crypto");

const {
  mongo: { ObjectId },
} = require("mongoose");
const { responseReturn } = require("../../utils/response");

const moment = require("moment");
const {
  sendPurchaseConfirmationEmail,
  sendStatusUpdateEmail,
} = require("../../utils/sendEmail");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class orderController {
  paymentCheck = async (id) => {
    try {
      const order = await customerOrder.findById(id);
      if (order.payment_status === "unpaid") {
        await customerOrder.findByIdAndUpdate(id, {
          delivery_status: "cancelled",
        });
        await authOrderModel.updateMany(
          {
            orderId: id,
          },
          {
            delivery_status: "cancelled",
          }
        );
      }
      return true;
    } catch (error) {
      console.log(error);
    }
  };

  place_order = async (req, res) => {
    const {
      price,
      products,
      shippingMethod,
      shippingInfo,
      userId,
      paymentMethod,
      currency,
    } = req.body;
    let authorOrderData = [];
    let cardId = [];
    const tempDate = moment(Date.now()).format("LLL");

    let customerOrderProduct = [];

    // Define shipping fees for each method
    const shippingFees = {
      standard: 5, // Example fees
      express: 15,
    };
    // Set shipping_fee based on selected shipping method
    const shipping_fee = shippingFees[shippingMethod] || shippingFees.standard;

    for (let i = 0; i < products.length; i++) {
      const pro = products[i].products;
      for (let j = 0; j < pro.length; j++) {
        let tempCusPro = pro[j].productInfo;
        tempCusPro.quantity = pro[j].quantity;
        customerOrderProduct.push(tempCusPro);
        if (pro[j]._id) {
          cardId.push(pro[j]._id);
        }
      }
    }

    try {
      // Check if stock is sufficient
      for (let product of customerOrderProduct) {
        const productRecord = await productModel.findById(product._id);
        if (productRecord.stock < product.quantity) {
          return res.status(400).json({
            message: `Not enough stock for product ${product.name}`,
          });
        }
      }

      const order = await customerOrder.create({
        customerId: userId,
        shippingInfo,
        products: customerOrderProduct,
        price: price + shipping_fee,
        currency,
        delivery_status: "pending",
        payment_status: "unpaid",
        shippingMethod,
        date: tempDate,
      });

      for (let i = 0; i < products.length; i++) {
        const pro = products[i].products;
        const pri = products[i].price;
        const sellerId = products[i].sellerId;
        let storePro = [];
        for (let j = 0; j < pro.length; j++) {
          let tempPro = pro[j].productInfo;
          tempPro.quantity = pro[j].quantity;
          storePro.push(tempPro);
        }

        authorOrderData.push({
          orderId: order.id,
          sellerId,
          products: storePro,
          price: pri,
          currency,
          payment_status: "unpaid",
          shippingInfo: "KeHager Bet Warehouse",
          delivery_status: "pending",
          shippingMethod,
          date: tempDate,
        });
      }
      await authOrderModel.insertMany(authorOrderData);
      for (let k = 0; k < cardId.length; k++) {
        await cardModel.findByIdAndDelete(cardId[k]);
      }
      setTimeout(() => {
        this.paymentCheck(order.id);
      }, 15000);
      responseReturn(res, 201, {
        message: "order placeed success",
        orderId: order.id,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  get_customer_databorad_data = async (req, res) => {
    const { userId } = req.params;

    try {
      const recentOrders = await customerOrder
        .find({
          customerId: new ObjectId(userId),
        })
        .limit(5);
      const pendingOrder = await customerOrder
        .find({
          customerId: new ObjectId(userId),
          delivery_status: "pending",
        })
        .countDocuments();
      const totalOrder = await customerOrder
        .find({
          customerId: new ObjectId(userId),
        })
        .countDocuments();
      const cancelledOrder = await customerOrder
        .find({
          customerId: new ObjectId(userId),
          delivery_status: "cancelled",
        })
        .countDocuments();
      responseReturn(res, 200, {
        recentOrders,
        pendingOrder,
        cancelledOrder,
        totalOrder,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  get_orders = async (req, res) => {
    const { customerId, status } = req.params;

    try {
      let orders = [];
      if (status !== "all") {
        orders = await customerOrder.find({
          customerId: new ObjectId(customerId),
          delivery_status: status,
        });
      } else {
        orders = await customerOrder.find({
          customerId: new ObjectId(customerId),
        });
      }
      responseReturn(res, 200, {
        orders,
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  get_order = async (req, res) => {
    const { orderId } = req.params;

    try {
      const order = await customerOrder.findById(orderId);
      responseReturn(res, 200, {
        order,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  get_admin_orders = async (req, res) => {
    let { page, parPage, searchValue } = req.query;
    page = parseInt(page);
    parPage = parseInt(parPage);

    const skipPage = parPage * (page - 1);

    try {
      if (searchValue) {
      } else {
        const orders = await customerOrder
          .aggregate([
            {
              $lookup: {
                from: "authororders",
                localField: "_id",
                foreignField: "orderId",
                as: "suborder",
              },
            },
          ])
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });

        const totalOrder = await customerOrder.aggregate([
          {
            $lookup: {
              from: "authororders",
              localField: "_id",
              foreignField: "orderId",
              as: "suborder",
            },
          },
        ]);

        responseReturn(res, 200, { orders, totalOrder: totalOrder.length });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  get_admin_order = async (req, res) => {
    const { orderId } = req.params;

    try {
      const order = await customerOrder.aggregate([
        {
          $match: { _id: new ObjectId(orderId) },
        },
        {
          $lookup: {
            from: "authororders",
            localField: "_id",
            foreignField: "orderId",
            as: "suborder",
          },
        },
      ]);
      responseReturn(res, 200, { order: order[0] });
    } catch (error) {
      console.log("get admin order " + error.message);
    }
  };

  admin_order_status_update = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      // Find the order to update its status
      const order = await customerOrder.findByIdAndUpdate(orderId, {
        delivery_status: status,
      });

      // Find the user (buyer) associated with this order
      const user = await customerModel.findById(order.customerId); // Assuming you have a User model

      // Send status update email to the customer
      await sendStatusUpdateEmail(user, order, status, res);

      responseReturn(res, 200, {
        message: "Order status changed and email sent to the customer.",
      });
    } catch (error) {
      // If any error occurs in the try block, catch it here
      console.log("Error updating order status or sending email:", error);
      return res.status(500).json({ message: "Internal server error" }); // Only one response here
    }
  };

  get_seller_orders = async (req, res) => {
    const { sellerId } = req.params;
    let { page, parPage, searchValue } = req.query;
    page = parseInt(page);
    parPage = parseInt(parPage);

    const skipPage = parPage * (page - 1);

    try {
      if (searchValue) {
      } else {
        const orders = await authOrderModel
          .find({
            sellerId,
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalOrder = await authOrderModel
          .find({
            sellerId,
          })
          .countDocuments();
        responseReturn(res, 200, { orders, totalOrder });
      }
    } catch (error) {
      console.log("get seller order error " + error.message);
      responseReturn(res, 500, { message: "internal server error" });
    }
  };

  get_seller_order = async (req, res) => {
    const { orderId } = req.params;

    try {
      const order = await authOrderModel.findById(orderId);

      responseReturn(res, 200, { order });
    } catch (error) {
      console.log("get admin order " + error.message);
    }
  };

  seller_order_status_update = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      await authOrderModel.findByIdAndUpdate(orderId, {
        delivery_status: status,
      });
      responseReturn(res, 200, { message: "order status change success" });
    } catch (error) {
      console.log("get admin order status error " + error.message);
      responseReturn(res, 500, { message: "internal server error" });
    }
  };

  create_payment = async (req, res) => {
    const { price } = req.body;

    try {
      const payment = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      responseReturn(res, 200, { clientSecret: payment.client_secret });
    } catch (error) {
      console.log(error.message);
    }
  };

  chapa_payment = async (req, res) => {
    const { price, orderId, tx_ref } = req.body;

    const chapaApiKey = process.env.CHAPA_SECRET_KEY;

    const order = await customerOrder.findById(orderId);
    const user = await customerModel.findById(order?.customerId);

    try {
      const payload = {
        order_id: orderId,
        amount: price,
        currency: "ETB",
        email: user?.email,
        name: user?.name,
        tx_ref: `txn-${Date.now()}`,
        callback_url: `https://multivendor-server-z8kg.onrender.com/api/order/confirm/${orderId}`,
        return_url: `https://multivendor-client.netlify.app/order/success/${orderId}`,
      };

      // Initiate payment request to Chapa
      const response = await axios.post(
        `https://api.chapa.co/v1/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: "Bearer " + chapaApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data["status"] == "success") {
        return res.json({
          msg: "Order created successfully. Perform payment.",
          paymentUrl: response.data["data"]["checkout_url"],
        });
      } else {
        return res.status(500).json({
          msg: "Something went wrong",
        });
      }
    } catch (error) {
      console.error("Chapa payment initiation error:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // chapa_verifyTransaction = async (req, res) => {
  //   const { orderId } = req.params;
  //   const chapaApiKey = process.env.CHAPA_SECRET_KEY;
  //   try {
  //     const order = await customerOrder.findById(orderId);
  //     const user = await customerModel.findById(order?.customerId);

  //     if (!order) return res.status(404).json({ message: "Order not found" });
  //     const chapaResponse = await axios.get(
  //       `${process.env.CHAPA_BASE_URL}/transaction/verify/${orderId}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${chapaApiKey}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (
  //       chapaResponse.data.status === "success" &&
  //       chapaResponse.data.data.status === "success"
  //     ) {
  //       // Update order as paid
  //       await customerOrder.findByIdAndUpdate(orderId, {
  //         payment_status: "paid",
  //         delivery_status: "pending",
  //       });

  //       // Decrease stock for each product
  //       for (let product of order.products) {
  //         await productModel.findByIdAndUpdate(product._id, {
  //           $inc: { stock: -product.quantity },
  //         });
  //       }

  //       const time = moment(Date.now()).format("L").split("/");
  //       await myShopWallet.create({
  //         amount: order.price,
  //         month: time[0],
  //         year: time[2],
  //       });
  //       for (let item of order.products) {
  //         await sellerWallet.create({
  //           sellerId: item.sellerId.toString(),
  //           amount: item.price,
  //           month: time[0],
  //           year: time[2],
  //         });
  //       }

  //       // Now, send the purchase confirmation email to the buyer
  //       await sendPurchaseConfirmationEmail(user, order, res);
  //       res.status(200).json({ message: "Payment verified successfully" });
  //     } else {
  //       res.status(400).json({ message: "Payment not verified or failed" });
  //     }
  //   } catch (error) {
  //     console.error("Chapa payment verification error:", error.message);
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // };

  // chapa_handle_callback = async (req, res) => {
  //   const { tx_ref, status } = req.query;
  //   const chapaApiKey = process.env.CHAPA_SECRET_KEY;

  //   try {
  //     const chapaResponse = await axios.get(
  //       `${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${chapaApiKey}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (
  //       chapaResponse.data.status === "success" &&
  //       chapaResponse.data.data.status === "success"
  //     ) {
  //       // Mark the order as paid
  //       const order = await customerOrder.findOneAndUpdate(
  //         { tx_ref },
  //         { payment_status: "paid", delivery_status: "pending" },
  //         { new: true }
  //       );

  //       // Notify customer of successful payment
  //       const user = await customerModel.findById(order.customerId);
  //       await sendPurchaseConfirmationEmail(user, order);

  //       // Update wallets, etc.
  //       this.updateWallets(order);

  //       res
  //         .status(200)
  //         .json({ message: "Payment successful and order updated" });
  //     } else {
  //       // Payment was unsuccessful
  //       await customerOrder.findOneAndUpdate(
  //         { tx_ref },
  //         { delivery_status: "cancelled" }
  //       );
  //       res.status(400).json({ message: "Payment unsuccessful" });
  //     }
  //   } catch (error) {
  //     console.error("Chapa callback error:", error.message);
  //     res.status(500).json({ message: "Internal server error" });
  //   }
  // };

  order_confirm = async (req, res) => {
    const { orderId } = req.params;

    let customerOrderProduct = [];

    try {
      await customerOrder.findByIdAndUpdate(orderId, {
        payment_status: "paid",
        delivery_status: "pending",
      });
      await authOrderModel.updateMany(
        { orderId: new ObjectId(orderId) },
        {
          payment_status: "paid",
          delivery_status: "pending",
        }
      );
      const cuOrder = await customerOrder.findById(orderId);
      const user = await customerModel.findById(cuOrder.customerId);
      const auOrder = await authOrderModel.find({
        orderId: new ObjectId(orderId),
      });

      // Decrease stock for each product
      for (let product of cuOrder.products) {
        await productModel.findByIdAndUpdate(product._id, {
          $inc: { stock: -product.quantity },
        });
      }

      const time = moment(Date.now()).format("l");

      const splitTime = time.split("/");

      await myShopWallet.create({
        amount: cuOrder.price,
        manth: splitTime[0],
        year: splitTime[2],
      });

      for (let i = 0; i < auOrder.length; i++) {
        await sellerWallet.create({
          sellerId: auOrder[i].sellerId.toString(),
          amount: auOrder[i].price,
          manth: splitTime[0],
          year: splitTime[2],
        });
      }

      // Now, send the purchase confirmation email to the buyer
      await sendPurchaseConfirmationEmail(user, cuOrder, res);

      responseReturn(res, 200, { message: "success" });
    } catch (error) {
      console.log(error.message);
    }
  };
}

module.exports = new orderController();
