const CONFIG = "config.yml"; // Lets assume doing this will give us config

class PaymentServiceProvider {
  constructor(paymentId, supplierId, amount, currency) {
    this.paymentId = paymentId;
    this.supplierId = supplierId;
    this.amount = amount;
    this.currency = currency;

    this.secretKey = CONFIG.security.psp1.secret_key;
    this.nonceHash = CONFIG.security.encoders;
    this.cryptoAlgo = CONFIG.security.psp1.encryption_algo;
    this.iv = CONFIG.security.psp1.iv;
  }
  async makePayment(paymentId, supplierId, amount, currency) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // This is idempotency key for Payment Service Provider
    const nonce = await crypto.subtle.digest("SHA-256", msgBuffer);

    const cipher = crypto.createCipheriv(
      this.cryptoAlgo,
      Buffer.from(this.secretKey),
      Buffer.from(this.iv)
    );
    // This checksum will let PSP validate data
    const checksum = cipher.update(msgBuffer);

    const pspDetails = await SomeOrm.query(`
      SELECT 
        PR.id AS paymentRequestID,
        PSP.pay_url AS serviceProviderURL
      FROM 
        PaymentRequest PR
      JOIN 
        PaymentServiceProvider PSP ON PR.psp_id = PSP.id
      WHERE 
        PR.id = ${paymentId}
    `);

    try {
      const response = fetch(pspDetails.serviceProviderURL, {
        method: "POST",
        body: JSON.stringify({
          paymentId,
          supplierId,
          amount,
          currency,
        }),
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();

      await SomeOrm.update(`
        UPDATE PaymentRequest
        SET pspToken = ${json.token}
        WHERE id = ${paymentRequestId}
      `);

      return { success: true, message: "Payment processed successfully." };
    } catch (e) {
      return { success: false, message: "Some failure" };
    }
  }

  async paymentWebhookCallBack(paymentResult) {
    const [paymentId, supplierId, amount, currency] = paymentResult;
    PaymentProcessor.handleSuccess(paymentId, {
      success: true,
      message: "Payment processed successfully.",
    });
  }

  /**
   * This method can be used for sending notification to FE about payment complete
   * In case FE client request for status, we can use this function
   */
  async paymentProviderStatus(paymentId) {
    const pspDetails = await SomeOrm.query(`
      SELECT 
        PR.id AS paymentRequestID,
        PR.token AS token,
        PSP.status_url AS pspStatusURL
      FROM 
        PaymentRequest PR
      JOIN 
        PaymentServiceProvider PSP ON PR.psp_id = PSP.id
      WHERE 
        PR.id = ${paymentId}
    `);

    try {
      const response = fetch(pspDetails.pspStatusURL, {
        method: "POST",
        body: JSON.stringify({
          token: pspDetails.token
        }),
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      return { success: true, message: json.status };
    } catch (e) {
      return { success: false, message: "Some failure" };
    }
  }
}
