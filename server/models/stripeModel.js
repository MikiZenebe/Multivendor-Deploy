const { Schema, model } = require("mongoose");

const stripeSchema = new Schema(
  {
    sellerId: {
      type: Schema.ObjectId,
      required: true,
    },
    stripeId: {
      type: String,
      required: false, // Make this optional if some payments might use Chapa instead
    },
    code: {
      type: String,
      required: true,
    },

    tx_ref: {
      type: String,
      required: false, // Unique transaction reference for Chapa
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("stripes", stripeSchema);
