const { PaymentServiceProvider } = require("./paymentServiceProvider");

class PaymentProcessor {

  async processPaymentRequest(paymentRequestId, supplier_id, amount, currency) {
    const result = await SomeOrm.query(
      `SELECT status, retry_count from PaymentRequest WHERE id = ${paymentRequestId}`
    );
    if (result.status === "processing" || result.status === "paid") {
      return {
        success: false,
        message: "Payment already processed or in process.",
      };
    } else if(result.status === "cancelled") {
      return {
        success: false,
        message: "Payment was cancelled, please do a new checkout",
      };
    } else if (result.status === "failed") {
      const retryCount = result.retry_count++;
      await SomeOrm.update(`
          UPDATE PaymentRequest
          SET status = 'processing', retry_count = ${retryCount}
          WHERE id = ${paymentRequestId}
      `);
    } else {
      await SomeOrm.insert(`
        INSERT INTO PaymentRequest (id, supplier_id, amount, currency)
        VALUES (${paymentRequestId}, ${supplier_id}, ${amount}, ${currency})
      `);
    }

    const paymentProvider = new PaymentServiceProvider(
      paymentRequestId,
      supplier_id,
      amount,
      currency
    );

    const paymentResult = await paymentProvider.makePayment();

    if (!paymentResult.success) {
      return this.handleFailure(paymentRequestId, paymentResult);
    }

    // In case of success, the payment is now queued by PSP to get fully processed
    return paymentResult;
  }

  async handleFailure(paymentRequestId, pspResult) {
    const request = await SomeOrm.query(
      `SELECT status, retry_count from PaymentRequest WHERE id = ${paymentRequestId}`
    );
    if (request.retry_count < MAX_RETRIES) {
      return this.processPaymentRequest(paymentRequestId); // Retry processing
    } else {
      await SomeOrm.update(`
        UPDATE PaymentRequest
        SET status = 'failed'
        WHERE id = ${paymentRequestId}
      `);

      await SomeOrm.insert(`
        INSERT INTO PaymentLogDao (payment_request_id, status, response_message)
        VALUES (${paymentRequestId}, "failed, ${pspResult.message})
      `);

      return {
        success: false,
        message: "Payment failed after retries: " + pspResult.message,
      };
    }
  }

  async handleSuccess(paymentRequestId, pspResult) {
    await SomeOrm.update(`
      UPDATE PaymentRequest
      SET status = 'paid'
      WHERE id = ${paymentRequestId}
    `);

    await SomeOrm.insert(`
      INSERT INTO PaymentLogDao (payment_request_id, status, response_message)
      VALUES (${paymentRequestId}, 'paid', ${pspResult.message})
    `);

    return { success: true, message: "Payment processed successfully." };
  }

  async cancelPayment(paymentRequestId) {
    await SomeOrm.update(`
      UPDATE PaymentRequest
      SET status = 'cancelled'
      WHERE id = ${paymentRequestId}
    `);

    await SomeOrm.insert(`
      INSERT INTO PaymentLogDao (payment_request_id, status)
      VALUES (${paymentRequestId}, 'cancelled')
    `);

    return { success: true, message: "Payment cancelled successfully." };
  }
}
