import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  coverImage?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  likedBy: string[];
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  parentId?: string;
}

interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  read: boolean;
  createdAt: string;
}

interface DBData {
  users: User[];
  posts: Post[];
  comments: Comment[];
  follows: Follow[];
  notifications: Notification[];
}

const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Default initial dataset
const INITIAL_USERS: User[] = [
  {
    id: "user_1",
    username: "alex_dev",
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    bio: "Full-stack engineer & open-source enthusiast 🚀 Building web apps & sharing insights.",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    followersCount: 3,
    followingCount: 2,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user_2",
    username: "maya_design",
    name: "Maya Lin",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    bio: "UI/UX Designer ✨ Obsessed with typography, clean interfaces & modern aesthetics.",
    coverImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
    followersCount: 2,
    followingCount: 3,
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user_3",
    username: "sam_photo",
    name: "Sam Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    bio: "Travel & street photographer 📸 Capturing moments around the world.",
    coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    followersCount: 2,
    followingCount: 1,
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user_4",
    username: "elena_code",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    bio: "AI Researcher & Python developer 🧠 Exploring Gemini, LLMs & generative media.",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    followersCount: 1,
    followingCount: 2,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_POSTS: Post[] = [
  {
    id: "post_1",
    userId: "user_1",
    content: "Just deployed our new Express + React full-stack template! Super smooth workflow with zero setup friction. What's everyone working on this week? 💻🔥",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80",
    likesCount: 3,
    commentsCount: 2,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    likedBy: ["user_2", "user_3", "user_4"],
  },
  {
    id: "post_2",
    userId: "user_2",
    content: "Minimalist design tip of the day: Whitespace isn't empty space, it's breathing room for your user's eyes. Less is often so much more. ✨🎨",
    likesCount: 2,
    commentsCount: 1,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    likedBy: ["user_1", "user_3"],
  },
  {
    id: "post_3",
    userId: "user_3",
    content: "Golden hour in Kyoto last autumn. Walking through the quiet alleyways was unforgettable. ⛩️🍁",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80",
    likesCount: 3,
    commentsCount: 1,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    likedBy: ["user_1", "user_2", "user_4"],
  },
  {
    id: "post_4",
    userId: "user_4",
    content: "Fascinating progress in multimodal models! Being able to seamlessly combine text, vision, and real-time audio reasoning opens up incredible user interface possibilities.",
    likesCount: 2,
    commentsCount: 0,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    likedBy: ["user_1", "user_2"],
  }
];

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "comment_1",
    postId: "post_1",
    userId: "user_2",
    content: "Looks super clean Alex! Love the dark accents and quick response times.",
    createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
  },
  {
    id: "comment_2",
    postId: "post_1",
    userId: "user_3",
    content: "Awesome tech stack! Might use this for my next photo gallery project.",
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "comment_3",
    postId: "post_2",
    userId: "user_1",
    content: "100% agreed! Padding and typography scale do 90% of the visual work.",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "comment_4",
    postId: "post_3",
    userId: "user_2",
    content: "Stunning shot Sam! The lighting is magical.",
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_FOLLOWS: Follow[] = [
  { followerId: "user_1", followingId: "user_2", createdAt: new Date().toISOString() },
  { followerId: "user_1", followingId: "user_3", createdAt: new Date().toISOString() },
  { followerId: "user_2", followingId: "user_1", createdAt: new Date().toISOString() },
  { followerId: "user_2", followingId: "user_3", createdAt: new Date().toISOString() },
  { followerId: "user_2", followingId: "user_4", createdAt: new Date().toISOString() },
  { followerId: "user_3", followingId: "user_1", createdAt: new Date().toISOString() },
  { followerId: "user_4", followingId: "user_1", createdAt: new Date().toISOString() },
  { followerId: "user_4", followingId: "user_2", createdAt: new Date().toISOString() },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    recipientId: "user_1",
    senderId: "user_2",
    type: "like",
    postId: "post_1",
    read: false,
    createdAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif_2",
    recipientId: "user_1",
    senderId: "user_3",
    type: "comment",
    postId: "post_1",
    read: false,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif_3",
    recipientId: "user_1",
    senderId: "user_4",
    type: "follow",
    read: true,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  }
];

// Helper to load/save database
function loadDB(): DBData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.error("Error reading database file, resetting to initial seed:", err);
  }

  const initialDB: DBData = {
    users: [...INITIAL_USERS],
    posts: [...INITIAL_POSTS],
    comments: [...INITIAL_COMMENTS],
    follows: [...INITIAL_FOLLOWS],
    notifications: [...INITIAL_NOTIFICATIONS],
  };
  saveDB(initialDB);
  return initialDB;
}

function saveDB(data: DBData) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

let db = loadDB();

// Helper to update user follower/following counters
function syncUserCounts() {
  db.users.forEach((user) => {
    user.followersCount = db.follows.filter((f) => f.followingId === user.id).length;
    user.followingCount = db.follows.filter((f) => f.followerId === user.id).length;
  });
}

// Helper to populate user details on posts & comments
function populatePost(post: Post): Post & { author?: User } {
  const author = db.users.find((u) => u.id === post.userId);
  return {
    ...post,
    author: author ? { ...author } : undefined,
  };
}

function populateComment(comment: Comment): Comment & { author?: User } {
  const author = db.users.find((u) => u.id === comment.userId);
  return {
    ...comment,
    author: author ? { ...author } : undefined,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // --- API ROUTES ---

  // Reset database endpoint
  app.post("/api/seed", (req, res) => {
    db = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      posts: JSON.parse(JSON.stringify(INITIAL_POSTS)),
      comments: JSON.parse(JSON.stringify(INITIAL_COMMENTS)),
      follows: JSON.parse(JSON.stringify(INITIAL_FOLLOWS)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    };
    syncUserCounts();
    saveDB(db);
    res.json({ success: true, message: "Database reseeded successfully" });
  });

  // GET /api/users - Get all users
  app.get("/api/users", (req, res) => {
    syncUserCounts();
    res.json(db.users);
  });

  // GET /api/users/:id - Get user profile details
  app.get("/api/users/:id", (req, res) => {
    syncUserCounts();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followers = db.follows
      .filter((f) => f.followingId === user.id)
      .map((f) => db.users.find((u) => u.id === f.followerId))
      .filter(Boolean);

    const following = db.follows
      .filter((f) => f.followerId === user.id)
      .map((f) => db.users.find((u) => u.id === f.followingId))
      .filter(Boolean);

    res.json({
      ...user,
      followers,
      following,
    });
  });

  // PUT /api/users/:id - Update user profile
  app.put("/api/users/:id", (req, res) => {
    const { name, bio, avatar, coverImage, username } = req.body;
    const userIndex = db.users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name !== undefined) db.users[userIndex].name = name;
    if (bio !== undefined) db.users[userIndex].bio = bio;
    if (avatar !== undefined) db.users[userIndex].avatar = avatar;
    if (coverImage !== undefined) db.users[userIndex].coverImage = coverImage;
    if (username !== undefined) db.users[userIndex].username = username;

    saveDB(db);
    res.json(db.users[userIndex]);
  });

  // POST /api/users/:id/follow - Toggle follow/unfollow
  app.post("/api/users/:id/follow", (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = (req.headers["x-user-id"] as string) || req.body.currentUserId;

    if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const existingFollowIndex = db.follows.findIndex(
      (f) => f.followerId === currentUserId && f.followingId === targetUserId
    );

    let isFollowing = false;

    if (existingFollowIndex >= 0) {
      // Unfollow
      db.follows.splice(existingFollowIndex, 1);
      isFollowing = false;
    } else {
      // Follow
      db.follows.push({
        followerId: currentUserId,
        followingId: targetUserId,
        createdAt: new Date().toISOString(),
      });
      isFollowing = true;

      // Notification
      db.notifications.unshift({
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        recipientId: targetUserId,
        senderId: currentUserId,
        type: "follow",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    syncUserCounts();
    saveDB(db);

    const targetUser = db.users.find((u) => u.id === targetUserId);
    res.json({
      isFollowing,
      targetUser,
    });
  });

  // GET /api/posts - Get posts list with filters
  app.get("/api/posts", (req, res) => {
    const { userId, feed, search, type } = req.query;
    const currentUserId = (req.headers["x-user-id"] as string) || (req.query.currentUserId as string) || "user_1";

    let result = [...db.posts];

    if (userId) {
      if (type === "liked") {
        result = result.filter((p) => p.likedBy.includes(userId as string));
      } else {
        result = result.filter((p) => p.userId === userId);
      }
    } else if (feed === "following") {
      const followingUserIds = db.follows
        .filter((f) => f.followerId === currentUserId)
        .map((f) => f.followingId);
      // Include current user's posts too
      followingUserIds.push(currentUserId);
      result = result.filter((p) => followingUserIds.includes(p.userId));
    } else if (feed === "trending") {
      result.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));
    } else {
      // Default: sort by newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (search && typeof search === "string" && search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((p) => {
        const author = db.users.find((u) => u.id === p.userId);
        return (
          p.content.toLowerCase().includes(query) ||
          (author && (author.name.toLowerCase().includes(query) || author.username.toLowerCase().includes(query)))
        );
      });
    }

    const populatedPosts = result.map((p) => populatePost(p));
    res.json(populatedPosts);
  });

  // GET /api/posts/:id - Get single post
  app.get("/api/posts/:id", (req, res) => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(populatePost(post));
  });

  // POST /api/posts - Create post
  app.post("/api/posts", (req, res) => {
    const { content, imageUrl } = req.body;
    const currentUserId = (req.headers["x-user-id"] as string) || req.body.currentUserId;

    if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ error: "Post content or image is required" });
    }

    const newPost: Post = {
      id: "post_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      userId: currentUserId,
      content: content || "",
      imageUrl: imageUrl || undefined,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      likedBy: [],
    };

    db.posts.unshift(newPost);
    saveDB(db);

    res.status(201).json(populatePost(newPost));
  });

  // DELETE /api/posts/:id - Delete post
  app.delete("/api/posts/:id", (req, res) => {
    const postId = req.params.id;
    const currentUserId = (req.headers["x-user-id"] as string) || (req.query.currentUserId as string);

    const postIndex = db.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (currentUserId && db.posts[postIndex].userId !== currentUserId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    db.posts.splice(postIndex, 1);
    // Delete associated comments
    db.comments = db.comments.filter((c) => c.postId !== postId);
    saveDB(db);

    res.json({ success: true, message: "Post deleted" });
  });

  // POST /api/posts/:id/like - Toggle like
  app.post("/api/posts/:id/like", (req, res) => {
    const postId = req.params.id;
    const currentUserId = (req.headers["x-user-id"] as string) || req.body.currentUserId;

    if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likedIndex = post.likedBy.indexOf(currentUserId);
    let isLiked = false;

    if (likedIndex >= 0) {
      // Unlike
      post.likedBy.splice(likedIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
      isLiked = false;
    } else {
      // Like
      post.likedBy.push(currentUserId);
      post.likesCount += 1;
      isLiked = true;

      // Send notification if not liking own post
      if (post.userId !== currentUserId) {
        db.notifications.unshift({
          id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
          recipientId: post.userId,
          senderId: currentUserId,
          type: "like",
          postId: post.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveDB(db);
    res.json(populatePost(post));
  });

  // GET /api/posts/:id/comments - Get comments for post
  app.get("/api/posts/:id/comments", (req, res) => {
    const postId = req.params.id;
    const comments = db.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => populateComment(c));

    res.json(comments);
  });

  // POST /api/posts/:id/comments - Add comment
  app.post("/api/posts/:id/comments", (req, res) => {
    const postId = req.params.id;
    const { content, parentId } = req.body;
    const currentUserId = (req.headers["x-user-id"] as string) || req.body.currentUserId;

    if (!currentUserId) {
      return res.status(400).json({ error: "Current user ID is required" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    const post = db.posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment: Comment = {
      id: "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      postId,
      userId: currentUserId,
      content: content.trim(),
      parentId: parentId || undefined,
      createdAt: new Date().toISOString(),
    };

    db.comments.push(newComment);
    post.commentsCount += 1;

    // Send notification to post owner if different user
    if (post.userId !== currentUserId) {
      db.notifications.unshift({
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        recipientId: post.userId,
        senderId: currentUserId,
        type: "comment",
        postId: post.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDB(db);
    res.status(201).json(populateComment(newComment));
  });

  // DELETE /api/comments/:id - Delete comment
  app.delete("/api/comments/:id", (req, res) => {
    const commentId = req.params.id;
    const currentUserId = (req.headers["x-user-id"] as string) || (req.query.currentUserId as string);

    const commentIndex = db.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = db.comments[commentIndex];
    if (currentUserId && comment.userId !== currentUserId) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    const post = db.posts.find((p) => p.id === comment.postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
    }

    db.comments.splice(commentIndex, 1);
    saveDB(db);

    res.json({ success: true, message: "Comment deleted" });
  });

  // GET /api/notifications - Get user notifications
  app.get("/api/notifications", (req, res) => {
    const currentUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string) || "user_1";
    const userNotifs = db.notifications
      .filter((n) => n.recipientId === currentUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((n) => {
        const sender = db.users.find((u) => u.id === n.senderId);
        const post = n.postId ? db.posts.find((p) => p.id === n.postId) : undefined;
        return {
          ...n,
          sender: sender ? { ...sender } : undefined,
          post: post ? populatePost(post) : undefined,
        };
      });

    res.json(userNotifs);
  });

  // PUT /api/notifications/read-all - Mark all as read
  app.put("/api/notifications/read-all", (req, res) => {
    const currentUserId = (req.headers["x-user-id"] as string) || req.body.userId || "user_1";
    db.notifications.forEach((n) => {
      if (n.recipientId === currentUserId) {
        n.read = true;
      }
    });
    saveDB(db);
    res.json({ success: true });
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
