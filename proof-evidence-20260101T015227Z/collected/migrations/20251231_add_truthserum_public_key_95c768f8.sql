-- Migration: add TruthSerum public key for key_id 95c768f8ad12eabf
-- Generated: 2025-12-31

INSERT INTO truthserum_public_keys (key_id, public_key_pem, is_active)
VALUES (
  '95c768f8ad12eabf',
  $$-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAk2XYK8g1gh6FY/tWtud+zDVBX2SlBj35FOyB7CHJI7c=
-----END PUBLIC KEY-----$$,
  true
);
