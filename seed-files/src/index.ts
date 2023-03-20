import * as fs from 'fs'
import path from 'path';
import axios from 'axios';
import userData  from './data/users.json';
import postData from './data/post.json';
import commentData from './data/comment.json';


async function main() {
    console.log("Starting Seed...")
    console.log("Creating Users...")
    for(const user of userData) {
        await axios.post('http://localhost:8000/CreateUser', user);
    }
    //Get Ids of Users
    const userIds = (await axios.get('http://localhost:8000/UserIds')).data;

    //Assign Friends
    console.log("Assigning Friends...")
    for(const user of userIds) {
        const friends:string[] = [];
        for(let i = 0; i < 5; i++) {
            const friend = userIds[Math.floor(Math.random() * userIds.length)];
            if(friend !== user && !friends.includes(friend)) {
                friends.push(friend);
            }
        }
        for(const friend of friends) {
            await axios.patch(`http://localhost:8000/AddFriend/${user}/${friend}`);
        };
    }

    //Create Posts
    console.log("Creating Posts...")
    for(const post of postData) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        await axios.post(`http://localhost:8000/CreatePost`, {...post, userId});
    }
    const postIds = (await axios.get('http://localhost:8000/PostIds')).data;

    //Create Comments
    console.log("Creating Comments...")
    for(const comment of commentData) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const postId = postIds[Math.floor(Math.random() * postIds.length)];
        await axios.post(`http://localhost:8000/CreateComment`, {...comment, userId, postId});
    }

    const commentIds = (await axios.get('http://localhost:8000/CommentIds')).data;

    //Like Posts
    console.log("Liking Posts and Comments...")
    for(const postId of postIds) {
        for(let i = 0; i < 50; i++) {
            const userId = userIds[Math.floor(Math.random() * userIds.length)];
            await axios.patch(`http://localhost:8000/LikePost/${userId}/${postId}`);
        }
    }

    //Like Comments
    for(const commentId of commentIds) {
        for(let i = 0; i < 100; i++) {
            const userId = userIds[Math.floor(Math.random() * userIds.length)];
            await axios.patch(`http://localhost:8000/LikeComment/${userId}/${commentId}`);
        }
    }



}

main()
