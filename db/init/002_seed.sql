INSERT INTO users (username, password_hash)
VALUES ('admin', '$2a$10$rIRTOapaN5q56TDePY5MeeIeS4rvVwFrb1udblzBRQInYQSDIeFL6')
ON CONFLICT (username) DO NOTHING;
