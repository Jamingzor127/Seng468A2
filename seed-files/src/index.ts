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
        await axios.post('http://localhost:5001/CreateUser', user);
    }

    //Assign Friends
    console.log("Assigning Friends...")
    for(const user of userData) {
        const friends:string[] = [];
        for(let i = 0; i < 5; i++) {
            const friend = userData[Math.floor(Math.random() * userData.length)];
            if(friend.username !== user.username && !friends.includes(friend.username)) {
                friends.push(friend.username);
            }
        }
        for(const friend of friends) {
            await axios.patch(`http://localhost:5001/AddFriend/${user.username}/${friend}`);
        };
    }

    //Create Posts
    console.log("Creating Posts...")
    for(const post of postData) {
        const userName = userData[Math.floor(Math.random() * userData.length)].username;
        await axios.post(`http://localhost:5001/CreatePost`, {...post, userName});
    }
    const postIds = (await axios.get('http://localhost:5001/PostIds')).data;

    //Create Comments
    console.log("Creating Comments...")
    for(const comment of commentData) {
        const userName = userData[Math.floor(Math.random() * userData.length)].username;
        const postId = postIds[Math.floor(Math.random() * postIds.length)];
        await axios.post(`http://localhost:5001/CreateComment`, {...comment, userName, postId});
    }

    const commentIds = (await axios.get('http://localhost:5001/CommentIds')).data;

    //Like Posts
    console.log("Liking Posts and Comments...")
    for(const postId of postIds) {
        for(let i = 0; i < 2; i++) {
            const userName = userData[Math.floor(Math.random() * userData.length)].username;
            await axios.patch(`http://localhost:5001/LikePost/${userName}/${postId}`);
        }
    }

    //Like Comments
    for(const commentId of commentIds) {
        for(let i = 0; i < 4; i++) {
            const userName = userData[Math.floor(Math.random() * userData.length)].username;
            await axios.patch(`http://localhost:5001/LikeComment/${userName}/${commentId}`);
        }
    }



}

main()
