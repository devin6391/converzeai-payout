CREATE TABLE PaymentRequest (
    id CHAR(36) NOT NULL PRIMARY KEY,
    supplier_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    /** lets assume we hardcode now to take only the first PSP */
    psp_id INT DEFAULT 1,
    pspToken TEXT,
    status ENUM('processing', 'paid', 'failed', 'cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    retry_count INT DEFAULT 0,
    FOREIGN KEY (psp_id) REFERENCES PaymentServiceProvider(id)
);

CREATE TABLE PaymentLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_request_id INT NOT NULL,
    status ENUM('processing', 'paid', 'failed', 'cancelled') NOT NULL,
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_request_id) REFERENCES PaymentRequest(id)
);

CREATE TABLE PaymentServiceProvider (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pay_url VARCHAR(255) NOT NULL,
  status_url VARCHAR(255) NOT NULL,
)