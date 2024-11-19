const { Schema, model } = require("mongoose");

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    method: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },

    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("customers", customerSchema);
