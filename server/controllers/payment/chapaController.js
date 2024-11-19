const axios = require("axios");

const CHAPA_API_URL = "https://api.chapa.co/v1/transaction/initialize";

// Load your Chapa secret key from environment variables
const CHAPA_SECRET_KEY = "CHASECK_TEST-tEzxuKcm5UDYCXp9WY5miv8dsZ3SRzuB";

class chapaController {
  create_payment = async (req, res) => {
    const {
      amount,
      currency,
      email,
      firstName,
      lastName,
      tx_ref,
      callback_url,
    } = req.body;

    try {
      const response = await axios.post(
        CHAPA_API_URL,
        {
          amount,
          currency,
          email,
          firstName,
          lastName,
          tx_ref,
          callback_url,
        },
        {
          headers: {
            Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response.data);
      // Return the checkout URL from Chapa
      res.status(200).json({ response });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Payment initialization failed" });
    }
  };
}

module.exports = new chapaController();
