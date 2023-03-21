"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const users_json_1 = __importDefault(require("./data/users.json"));
const post_json_1 = __importDefault(require("./data/post.json"));
const comment_json_1 = __importDefault(require("./data/comment.json"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting Seed...");
        console.log("Creating Users...");
        for (const user of users_json_1.default) {
            yield axios_1.default.post('http://localhost:5001/CreateUser', user);
        }
        //Assign Friends
        console.log("Assigning Friends...");
        for (const user of users_json_1.default) {
            const friends = [];
            for (let i = 0; i < 5; i++) {
                const friend = users_json_1.default[Math.floor(Math.random() * users_json_1.default.length)];
                if (friend.username !== user.username && !friends.includes(friend.username)) {
                    friends.push(friend.username);
                }
            }
            for (const friend of friends) {
                yield axios_1.default.patch(`http://localhost:5001/AddFriend/${user.username}/${friend}`);
            }
            ;
        }
        //Create Posts
        console.log("Creating Posts...");
        for (const post of post_json_1.default) {
            const userName = users_json_1.default[Math.floor(Math.random() * users_json_1.default.length)].username;
            yield axios_1.default.post(`http://localhost:5001/CreatePost`, Object.assign(Object.assign({}, post), { userName }));
        }
        const postIds = (yield axios_1.default.get('http://localhost:5001/PostIds')).data;
        //Create Comments
        console.log("Creating Comments...");
        for (const comment of comment_json_1.default) {
            const userName = users_json_1.default[Math.floor(Math.random() * users_json_1.default.length)].username;
            const postId = postIds[Math.floor(Math.random() * postIds.length)];
            yield axios_1.default.post(`http://localhost:5001/CreateComment`, Object.assign(Object.assign({}, comment), { userName, postId }));
        }
        const commentIds = (yield axios_1.default.get('http://localhost:5001/CommentIds')).data;
        //Like Posts
        console.log("Liking Posts and Comments...");
        for (const postId of postIds) {
            for (let i = 0; i < 2; i++) {
                const userName = users_json_1.default[Math.floor(Math.random() * users_json_1.default.length)].username;
                yield axios_1.default.patch(`http://localhost:5001/LikePost/${userName}/${postId}`);
            }
        }
        //Like Comments
        for (const commentId of commentIds) {
            for (let i = 0; i < 4; i++) {
                const userName = users_json_1.default[Math.floor(Math.random() * users_json_1.default.length)].username;
                yield axios_1.default.patch(`http://localhost:5001/LikeComment/${userName}/${commentId}`);
            }
        }
    });
}
main();
//# sourceMappingURL=index.js.map