-- 1. Insert Users
INSERT INTO USERS (first_name, last_name, phone_number, password_hash, verified) VALUES
('Fardin', 'Shadab', '01700000001', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash1', TRUE),
('Rahim', 'Ahmed', '01700000002', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash2', TRUE),
('Karim', 'Chowdhury', '01800000003', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash3', FALSE);

-- 2. Insert Requests (User 1 creates a blood request)
INSERT INTO REQUEST (blood_type, urgency, status, user_id) VALUES
('O+', 'HIGH', 'PENDING', 1),
('A-', 'MEDIUM', 'PENDING', 3);

-- 3. Insert Donors (User 2 is registered as a donor and accepts Request 1)
INSERT INTO DONOR (user_id, donation_count, blood_type, request_id) VALUES
(2, 5, 'O+', 1);

-- 4. Insert Donor Availability Log
INSERT INTO DONOR_AVAILABLITY (last_donated, donor_id) VALUES
('2026-01-15 10:00:00', 2);

-- 5. Insert Chatroom for Request 1
INSERT INTO CHATROOM (request_id) VALUES
(1);

-- 6. Insert Reviews (User 1 reviews Donor 2)
INSERT INTO DONOR_REVIEW (donor_id, user_id, comment, rating) VALUES
(2, 1, 'Quick response and very helpful!', '5/5');

-- 7. Insert Notification & Link via SENT_TO
INSERT INTO NOTIFICATION (request_id, read_status) VALUES
(1, 'PENDING');

INSERT INTO SENT_TO (user_id, notification_id) VALUES
(2, 1);