-- seed.sql

-- Εισαγωγή παικτών
INSERT INTO users (id, role, password) VALUES ('player1', 'player', 'pass1');
INSERT INTO users (id, role, password) VALUES ('player2', 'player', 'pass2');
INSERT INTO users (id, role, password) VALUES ('player3', 'player', 'pass3');

-- Εισαγωγή πονταριστών
INSERT INTO users (id, role, password) VALUES ('bettorA', 'bettor', 'ΑA1');
INSERT INTO users (id, role, password) VALUES ('bettorB', 'bettor', 'BB2');
INSERT INTO users (id, role, password) VALUES ('bettorC', 'bettor', 'CC3');