-- Up
CREATE TABLE daily(name TEXT NOT NULL, completed INTEGER NOT NULL, lastUpdated TEXT NOT NULL);
CREATE TABLE weekly(name TEXT NOT NULL, completed INTEGER NOT NULL, lastUpdated TEXT NOT NULL);
CREATE TABLE longterm(name TEXT NOT NULL, completed INTEGER NOT NULL, lastUpdated TEXT NOT NULL);

-- Down
DROP TABLE longterm;
DROP TABLE weekly;
DROP TABLE daily;
