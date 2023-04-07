# General
To set up the nginx server, the three apis, redis, mongo, and kafka. You simply have to run `docker-compose up` from the root of this project. This will automatically build and start all necessary services. The nginx server runs on `localhost:5001`, mongo runs on `localhost:27017`, and the kafka UI runs on `localhost:8080`. The kafka UI can be used to see the current state of the Kafka cluster. The only other port that is exposed by the system is the actual Kafka instance which runs on `localhost:9092` for the producers, and `localhost:9093` for the consumers.

# API

The api is built with NestJS and uses Swagger. This means that by going to `localhost:5001/api` you will access a page that allows you to easily see all supported api calls and run supported api calls against the api. Calling get on `localhost:5001` will return the hostname of the server that was called (it should be different every time as the servers as in a round robin configuration).

Below is the extensive list of all the API calls the system supports. These are all on the Swagger page mentioned above. 

* GET `localhost:5001/` - Returns the hostname of the Server
* GET `localhost:5001/UserIds` - Returns all User Ids
* GET `localhost:5001/Usernames` - Returns all Usernames
* POST `localhost:5001/CreateUser` - Takes a body in the form of 
```
{
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string",
  "email": "string",
  "dateOfBirth": "string"
}
```
and creates a user based on that information if no constraints are hit
* DELETE `localhost:5001/User/{username}` - Deletes a given user with the provided username. 
* PATCH `localhost:5001/AddFriend/{username}/{friendUsername}` - Updates the database to indicate that the two provided usernames are friends. 
* PATCH `localhost:5001/RemoveFriend/{username}/{friendUsername}` - Updates the database to indicate that the two provided usernames are no longer friends.
* GET `localhost:5001/Friends/{username}` - Returns a list of users who are friends with the given username. 
* GET `localhost:5001/CommentIds` - Returns all comment ids. 
* POST `localhost:5001/CreateComment` - Takes a body in the form of
```
{
  "postId": "string",
  "userName": "string",
  "content": "string"
}
```
and creates a new comment based on that. PostId must be a valid post as comments are tied to posts. 
* DELETE `localhost:5001/Comment/{username}/{commentId}` - Deletes the comment that is connected to the provided commentId only if the username owns that comment. 
* PATCH `localhost:5001/EditComment` - Takes a body in the form of 
```
{
  "userName": "string",
  "commentId": "string",
  "content": "string"
}
```
and lets a user edit a specific comment only if they own that comment. 
* PATCH `localhost:5001/LikeComment/{username}/{commentId}` - Allows a given user to like a given comment.
* PATCH `localhost:5001/UnlikeComment/{username}/{commentId}` - Allows a user to unlike a given comment. 
* GET `localhost:5001/LikedComments/{username}` - Allows a given user to get all the comments that they have liked.
* GET `localhost:5001/CommentsForUser/{username}` - Allows a given user to get all the comments they have made.
* GET `localhost:5001/CommentsForPost/{id}` - Returns all the comments associated with the provided post id. 
* GET `localhost:5001/CommentsForPostForUser/{username}/{postId}` - Allows a user to find all the comments that belong to them on a particular post.
* GET `localhost:5001/Comment/{commentId}` - Returns the comment that is associated with the provided commentId if it exists.
* GET `localhost:5001/PostIds` - Returns all post ids.
* POST `localhost:5001/CreatePost` - Takes a body in the form of
```
{
  "userName": "string",
  "title": "string",
  "content": "string"
}
```
and creates a new post based on that information. Username must exist.
* DELETE `localhost:5001/Post/{postId}` - Deletes the post of the provided post Id.
* GET `localhost:5001/Post/{postId}` - Returns the post that is identified by the provided post id. 
* PATCH `localhost:5001/EditPost` - Takes a body in the form of
```
{
  "postId": "string",
  "title": "string",
  "content": "string"
}
```
and if the postId exists, edits the post with the provided information.
* PATCH `localhost:5001/LikePost/{username}/{postId}` - Allows a user to like a specific post.
* PATCH `localhost:5001/UnlikePost/{username}/{postId}` - ALlows a user to unlike a specific post if they have liked it previously.
* GET `localhost:5001/LikedPosts/{username}` - Allows a user to get all the posts that they have liked.
* GET `localhost:5001/PostsForUser/{username}` - Allows a user to get all the post that they have made.
* GET `localhost:5001/UserReports/{username}` - Allows a User to generate and get a raw report on the activity they have made on the service. This includes their friends, posts, comments, and all the posts/comments that they have liked. 
* GET `localhost:5001/UserReportFormatted/{username}` - Allows a User to generate and get a less raw report that instead of returning all user data, returns a smaller version of that data (eg instead of receiving all liked comments, just getting the number of comments you liked).
* POST `localhost:5001/SendMessage` - Takes a body in the form of 
```
{
  "userNameSender": "string",
  "userNameReceiver": "string",
  "message": "string"
}
```
and pushes the message to the right user through kafka.
* POST `localhost:5001/TestKafka` - Takes a body in the form of
```
{
    "message": "string"
}
```
and sends that message to kafka on the test topic. Just for testing purposes. 

# Seed Files

There is a directory called `seed-files` in this project. It is in here you are able to run commands to generate data for the database. This script hits the apis to create all the necessary data. To run this, simply navigate to the `seed-files` directory and run `npm run seed` (node_modules and dist are already built for you, you will need node to run this though). This will generate all the data and return user reports for each user into `<root>/seed-files/dist/reports` in a json format. 

# Test Client Consumer

The test client consumer subscribes to the user `zcnFjK`'s message and notification topics. This can be run by using `npm install` to install the node modules and then run `npm run start` which will connet to kafka and subscribe to the given topics (dist is already built for you, you will need node to run this though). If you start the consumer, then run the seed script, you will see the messages from kafka come through on the terminal logs. 