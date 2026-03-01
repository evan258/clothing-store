CREATE DATABASE ecommerce;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT NOT NULL
);

ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL;
ALTER TABLE cart_items ADD COLUMN id SERIAL PRIMARY KEY;

INSERT INTO users (user_name, email, phone, password_hash)
VALUES(
    'James L',
    'james@gmail.com',
    '1234567890',
    '$2b$10$0KriI6UwkfjK3QIByD5LyedY7VC7LOYNnJpBBEuwNQfUYLwmy882S'
) RETURNING *;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

CREATE TABLE product_variants (
    product_id INTEGER NOT NULL,
    size VARCHAR(10) NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL')),
    stock INTEGER NOT NULL CHECK (stock >= 0),

    CONSTRAINT fk_product_variant
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

    CONSTRAINT unique_product_size
    UNIQUE (product_id, size)
);

UPDATE products SET name = 'Black Striped Tshirt' WHERE id = 9;

INSERT INTO products (name, image_url, price_cents)
VALUES (
    'Faded Skinny Jeans',
    '/products/faded_skinny_jeans.png',
    1200 
)
RETURNING *;

ALTER TABLE categories ADD COLUMN image_url TEXT NOT NULL DEFAULT '/categories/gym.png';

UPDATE categories SET image_url = '/categories/party.png' WHERE id = 3 RETURNING *;

INSERT INTO product_variants (product_id, size, stock)
VALUES
(13, 'S', 1),
(13, 'M', 6), 
(13, 'L', 3),
(13, 'XL', 2)
RETURNING *;

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT reviews_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

    CONSTRAINT unique_user_product_review
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);

INSERT INTO reviews (user_id, product_id, rating, review_text)
VALUES (
    1,
    5,
    4,
    $$"This t-shirt is a fusion of comfort and creativity. The fabric is soft, and the design speaks volumes about the designer's skill. It's like wearing a piece of art that reflects my passion for both design and fashion."$$
) RETURNING *;

UPDATE reviews SET rating = 5 WHERE id IN (1, 5);

ALTER TABLE products ADD COLUMN total_sold INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE products SET total_sold = 15 WHERE id = 6;

CREATE TABLE categories(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categories (name) VALUES ('Gym'), ('Casual'), ('Party'), ('Formal');

ALTER TABLE products  ADD COLUMN category_id INTEGER,
ADD CONSTRAINT fk_product_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE SET NULL;

ALTER TABLE users DROP COLUMN phone;

CREATE TABLE products_categories (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

INSERT INTO products_categories (product_id, category_id) VALUES (13, 2);

CREATE TABLE delivery_options (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    estimated_days INTEGER NOT NULL CHECK (estimated_days > 0)
);

INSERT INTO delivery_options (name, price_cents, estimated_days)
VALUES
('Normal', 0, 7),
('Fast', 500, 3),
('Super Fast', 1000, 1);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status
        IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),

    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    order_id INTEGER NOT NULL
    REFERENCES orders(id)
    ON DELETE CASCADE,
    product_id INTEGER NOT NULL
    REFERENCES products(id),
    size VARCHAR(10) NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (order_id, product_id, size)
);

ALTER TABLE orders ADD COLUMN delivery_options_id INTEGER NOT NULL,
ADD CONSTRAINT fk_orders_delivery_option
FOREIGN KEY (delivery_options_id)
REFERENCES delivery_options(id);

CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE
    REFERENCES users(id)
    ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    cart_id INTEGER NOT NULL
    REFERENCES carts(id)
    ON DELETE CASCADE,
    product_id INTEGER NOT NULL
    REFERENCES products(id)
    ON DELETE CASCADE,
    size VARCHAR(10) NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE (cart_id, product_id, size)
);

INSERT INTO carts (user_id) VAlUES (1),(2),(3),(4), (5), (6), (7), (8);

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

