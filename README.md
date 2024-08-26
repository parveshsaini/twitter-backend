> Welcome to the BACKEND repository for my Twitter project! <br/>
> You can find the FRONTEND repository [here](https://github.com/parveshsaini/twitter-client). <br/>
> And the server metrics dashboard [here](https://grafana-parvesh.mooo.com/public-dashboards/fbefb030b7614962994c9b49551c4fdc?orgId=1)

## Introduction

This repository encompasses two primary services:

1. **Messaging Service:** This service manages real-time communication between users, facilitating instant messaging with a scalable, efficient architecture.

2. **Twitter Operations Service:** This service handles various operations related to the core functionality of Twitter, such as user management, tweet creation, liking, and following.
  
![image](https://github.com/user-attachments/assets/e89c162f-8547-4a34-870d-7e2c3b2623f4)
<br/>

   

## Messaging Service
Messaging service is a real-time, scalable chat application built on top of WebSocket connection. It ensures seamless and efficient communication between clients, regardless of the server they are connected to. Here’s a structured overview of how it works:


### **Overview**
- Clients can connect to any of the horizontally scaled WebSocket application servers, ensuring load balancing and high availability.
- WebSocket servers communicate with each other via Redis, facilitating message exchange across different servers.
  
### **Message flow**
- When a client sends a message, it is first emitted to the Redis server by the WebSocket application server.
- Redis then forwards the message to the appropriate WebSocket server where the recipient client is connected.
- The target client receives the message through the connected WebSocket server.

### **Handling high throughput**
- Upon receiving a message, the WebSocket application server pushes the message to a Kafka queue.
- A Kafka consumer retrieves the message from the queue and inserts it into a PostgreSQL database for persistence and later retrieval.
- Thus saving database from crashing at peak traffic.

![image](https://github.com/user-attachments/assets/46e1f6ab-e121-4ffa-8642-4081213be4be)

### Relationships Overview

- **User to Tweet:** A one-to-many relationship where a user can have many tweets.
- **User to Likes:** A many-to-many relationship via the `Likes` model, where a user can like many tweets and a tweet can be liked by many users.
- **User to Follows:** A self-referencing many-to-many relationship via the `Follows` model, where a user can follow many users and be followed by many users.
- **User to Conversation:** A one-to-many relationship where a user can participate in many conversations.
- **User to Message:** A one-to-many relationship where a user can send many messages.
- **Conversation to User:** A many-to-many relationship where a conversation can have many participants.
- **Conversation to Message:** A one-to-many relationship where a conversation can have many messages.
- **Message to Conversation:** A message belongs to a single conversation.
- **Message to User:** A message is sent by a single user.


![image](https://github.com/user-attachments/assets/9aefc45a-15cd-4ae1-8189-0d7696c8fde8)

## Twitter Operations Service

The Twitter Operations Service handles the core functionalities of the Twitter project, managing various operations related to user interactions and content creation. Here are the key components and features of this service:

1. **User Management:**
   - Handles user registration, authentication, and profile management.
   - Manages user information such as names, email addresses, and profile images.
   - Manages following and follower relationships through the `Follows` model.

2. **Tweet Management:**
   - Allows users to create, edit, and delete tweets.
   - Supports tweets with text and optional images.
   - Tracks tweet creation and update timestamps.
   - Manages tweet interactions, including likes, through the `Likes` model.

3. **Like Management:**
   - Allows users to like and unlike tweets.
   - Keeps track of the relationship between users and liked tweets.

4. **Follower and Following Management:**
   - Manages the self-referencing many-to-many relationships between users.
   - Allows users to follow and unfollow other users.
   - Tracks followers and following lists for each user.

5. **Conversation Management:**
   - Handles the creation and management of conversations between users.
   - Manages participants in conversations through the `participants` relationship.

6. **Message Management:**
   - Allows users to send and receive messages in real-time.
   - Manages message content, timestamps, and the relationship between messages and conversations.


