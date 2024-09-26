CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  nationality VARCHAR(100),
  phone_number VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customer_status VARCHAR(10) DEFAULT 'Active',
  notes TEXT
);

ALTER TABLE customers
ADD CONSTRAINT email_format_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE bookings
ADD COLUMN last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create a function to update the 'last_modified' column
CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that fires on updates to the table
CREATE TRIGGER update_last_modified_trigger
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

ALTER TABLE bookings
ADD CONSTRAINT end_date_after_start_date
CHECK (end_date > start_date);