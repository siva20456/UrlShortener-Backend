# UrlShortener-Backend for URL MANAGEMENT SYSTEM

## Introduction
DataBase Queries and Backend Functionalities on UrlShortener. URL shortening involves taking a long URL and creating a shorter alias or redirect link.


## Features
List out the key features of your application.

- Feature 1 - Database Management
- Feature 2 - Adding Shortened URLs
- Feature 3 - Timed Deletions of URLs
- Feature 4 - Maintaining analytics


## Installation & Getting started
Detailed instructions on how to install, configure, and get the project running.

```
npm install my-project
cd my-project
nodemon app / node app.js
```


## APIs Used
- bcrypt - hashing passwords
- JWT - jsonwebtokens
- pg - PostgreSQL

## API Endpoints
GET /api/analytics - retrieve all urls
POST /api/addUrls - create a new URLs
POST /api/login - user login
POST /api/regiter - user registration



## Technology Stack

- PostgreSQL
- Node.js
- Express.js
- Other libraries/modules

## Tables

Table users:

- user_id: Primary key, unique identifier for each user.
- username: Unique username for each user.
- hashed_password: Hashed password for security.

Table urls:

- url_id: Primary key, unique identifier for each URL.
- user_id: Foreign key referencing user_id in the users table, indicating the owner of the URL.
- urllink: The actual URL link, which must be unique.
- origin: The original website or source associated with the URL.
- createddate: Timestamp indicating when the URL was created.
- expirydate: Timestamp indicating when the URL will expire.

Table analytics:

- analytics_id: Primary key, unique identifier for each analytics record.
- urllink: Foreign key referencing urllink in the urls table, the URL being tracked.
- user_id: Foreign key referencing user_id in the users table, indicating the owner of the analytics data.
- clicks: Counter for the number of clicks the URL has received.

## ER Diagram 

+------------+         +------------+         +-------------+
|   users    |         |    urls    |         |  analytics  |
+------------+         +------------+         +-------------+
| user_id    |<------- | user_id    |         | analytics_id|
| username   |         | url_id     |         | urllink     |<-----+
| hashed_pwd |         | urllink    |<--------| user_id     |      |
+------------+         | origin     |         | clicks      |      |
                       | createdate |         +-------------+      |
                       | expirydate |                               |
                       +------------+                               |
                                                                    |
                                                                    |
                                                                    +------------+
                                                                                 |
