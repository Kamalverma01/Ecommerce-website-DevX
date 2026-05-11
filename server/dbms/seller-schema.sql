CREATE TABLE sellers (
  id CHAR(24) PRIMARY KEY,
  user_id CHAR(24) NOT NULL UNIQUE,
  business_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(500) NOT NULL,
  business_type VARCHAR(100) DEFAULT '',
  support_email VARCHAR(255) DEFAULT '',
  gst_number VARCHAR(30) DEFAULT '',
  pickup_pincode VARCHAR(12) DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  commission_override DECIMAL(5, 2) DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  rejected_at DATETIME DEFAULT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_seller_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE seller_product_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id CHAR(24) NOT NULL,
  category_name VARCHAR(120) NOT NULL,
  CONSTRAINT fk_seller_categories_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_user_id ON sellers(user_id);
CREATE INDEX idx_seller_product_categories_seller_id
  ON seller_product_categories(seller_id);
