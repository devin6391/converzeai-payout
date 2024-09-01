const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
// Import the PaymentProcessor class
const { PaymentProcessor } = require("./paymentProcessor");

const app = express();
const port = 3000;

// Use bodyParser to parse application/json
app.use(bodyParser.json());
app.use(cookieParser());

const paymentProcessor = new PaymentProcessor();

// Checkout endpoint: Generate a UUID and set it as a cookie
// This endpoint is called when the user checks out from shopping cart to reach confirma payment page.
// This endpoint doesn't make payment.
app.post("/checkout", (req, res) => {
  const checkoutId = uuidv4();
  // Send this cookie where checkoutId acts a idempotency key
  // This has an expiry time of 5 minutes. FE should show this to user.
  res.cookie("checkoutId", checkoutId, { httpOnly: true, maxAge: 5 * 60 * 1000 });
  // TODO: Think of a solution later for mobile OSes. Maybe using cookie is possible
  res.status(200).send("Checkout initialized. Proceed to payment.");
});

// This endpoint makes payment.
app.post("/processPayment", async (req, res) => {
  const checkoutId = req.cookies["checkoutId"];

  if (!checkoutId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No checkout session found. Please initiate checkout first.",
      });
  }

  try {
    const result = await paymentProcessor.processPaymentRequest(checkoutId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/cancelPayment", async (req, res) => {
  const checkoutId = req.cookies["checkoutId"];

  if (!checkoutId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No checkout session found. Please cancel on a payment",
      });
  }

  try {
    const result = await paymentProcessor.cancelPayment(checkoutId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error cancelling payment:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
