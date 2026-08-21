CREATE TABLE IF NOT EXISTS USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    phone_number varchar(20) NOT NULL,
    password_hash varchar(255) NOT NULL,
    verified boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS DONOR_AVAILABLITY (
    last_donated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    donor_id INT,
    PRIMARY KEY (last_donated, donor_id),

    CONSTRAINT fk_donor_availability
        FOREIGN KEY (donor_id)
        REFERENCES USERS(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS REQUEST (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    blood_type varchar(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    urgency varchar(50),
    status varchar(50),
    user_id INT,

    CONSTRAINT fk_request_by
        FOREIGN KEY (user_id)
        REFERENCES USERS(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS DONOR (
    user_id INT PRIMARY KEY,
    donation_count INT,
    blood_type varchar(10),
    request_id INT NULL UNIQUE,

    CONSTRAINT fk_parent_donor
        FOREIGN KEY (user_id)
        REFERENCES USERS(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_request_accepted
        FOREIGN KEY (request_id)
        REFERENCES REQUEST(request_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS CHATROOM (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_id INT,

    CONSTRAINT fk_chatroom_of_request
        FOREIGN KEY (request_id)
        REFERENCES REQUEST(request_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE 
);

CREATE TABLE IF NOT EXISTS DONOR_REVIEW (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT,
    user_id INT,
    comment varchar(255),
    rating varchar(20),

    CONSTRAINT fk_donor_identifier
        FOREIGN KEY (donor_id)
        REFERENCES USERS(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reviewer_identifier
        FOREIGN KEY (user_id)
        REFERENCES USERS(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS NOTIFICATION (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT,
    read_status varchar(100) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_request
        FOREIGN KEY (request_id)
        REFERENCES REQUEST(request_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS SENT_TO (
    user_id INT,
    notification_id INT,
    PRIMARY KEY(user_id, notification_id),

    CONSTRAINT fk_notification_to_user
        FOREIGN KEY (user_id)
        REFERENCES USERS(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_notification_identifier
        FOREIGN KEY (notification_id)
        REFERENCES NOTIFICATION(notification_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);