-- 001_init.sql
START TRANSACTION;

-- Ensure database exists and is selected
CREATE DATABASE IF NOT EXISTS appdb CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE appdb;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Images
CREATE TABLE IF NOT EXISTS images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(1024) NOT NULL, -- can hold s3://... or local path
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_images_user_id (user_id),
  CONSTRAINT fk_images_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Detections
CREATE TABLE IF NOT EXISTS detections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  image_id BIGINT UNSIGNED NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  x INT NOT NULL,
  y INT NOT NULL,
  w INT NOT NULL,
  h INT NOT NULL,
  confidence DECIMAL(5,4) NOT NULL, -- 0.0000 to 9.9999 (use CHECK or app validation)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_detections_image_id (image_id),
  KEY idx_detections_class_name (class_name),
  CONSTRAINT fk_detections_image_id
    FOREIGN KEY (image_id) REFERENCES images(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- QA Messages
CREATE TABLE IF NOT EXISTS qa_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  image_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qamessages_image_id (image_id),
  KEY idx_qamessages_user_id (user_id),
  CONSTRAINT fk_qamessages_image_id
    FOREIGN KEY (image_id) REFERENCES images(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qamessages_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Helpful views or checks (optional)
-- You can enforce 0..1 for confidence via application-level validation.


COMMIT;
-- End of 001_init.sql