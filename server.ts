import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { Task, User, TaskStatus, TaskPriority } from "./src/types.js";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "super-secure-default-jwt-secret-key-123456";

// Ensure DB exists with default structures
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ users: [], tasks: [] }, null, 2)
  );
}

// DB Helper functions
interface DBStore {
  users: Array<User & { passwordHash: string; salt: string }>;
  tasks: Task[];
}

function readDB(): DBStore {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return { users: [], tasks: [] };
  }
}

function writeDB(data: DBStore) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Cryptography Utilities
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
}

function generateToken(userId: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${userId}.${expiry}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [userId, expiry, signature] = parts;
    if (parseInt(expiry, 10) < Date.now()) return null;

    const payload = `${userId}.${expiry}`;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(payload)
      .digest("hex");

    if (signature === expectedSignature) {
      return userId;
    }
  } catch (err) {
    // Ignore verification errors
  }
  return null;
}

app.use(express.json());

// Express Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(403).json({ error: "Invalid or expired session token" });
  }

  req.userId = userId;
  next();
}

// ==================== RESTful API Routes ====================

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const db = readDB();
  const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const userId = crypto.randomUUID();

  const newUser = {
    id: userId,
    name,
    email: email.toLowerCase(),
    passwordHash,
    salt,
  };

  db.users.push(newUser);
  writeDB(db);

  const token = generateToken(userId);
  res.status(201).json({
    token,
    user: { id: userId, name, email: email.toLowerCase() },
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const calculatedHash = hashPassword(password, user.salt);
  if (calculatedHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken(user.id);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// Get User Detail
app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ id: user.id, name: user.name, email: user.email });
});

// Get Tasks
app.get("/api/tasks", authenticateToken, (req: any, res) => {
  const db = readDB();
  let userTasks = db.tasks.filter((t) => t.userId === req.userId);

  // Apply filters
  const { search, status, priority } = req.query;

  if (search) {
    const query = String(search).toLowerCase();
    userTasks = userTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
    );
  }

  if (status && status !== "all") {
    userTasks = userTasks.filter((t) => t.status === status);
  }

  if (priority && priority !== "all") {
    userTasks = userTasks.filter((t) => t.priority === priority);
  }

  res.json(userTasks);
});

// Create Task
app.post("/api/tasks", authenticateToken, (req: any, res) => {
  const { title, description, priority, dueDate, status } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const db = readDB();
  const newTask: Task = {
    id: crypto.randomUUID(),
    userId: req.userId,
    title,
    description: description || "",
    priority: (priority as TaskPriority) || "Medium",
    status: (status as TaskStatus) || "Pending",
    dueDate: dueDate || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.tasks.push(newTask);
  writeDB(db);

  res.status(201).json(newTask);
});

// Update Task
app.put("/api/tasks/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { title, description, priority, dueDate, status } = req.body;

  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === id && t.userId === req.userId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found or access denied" });
  }

  const existingTask = db.tasks[taskIndex];
  const updatedTask: Task = {
    ...existingTask,
    title: title !== undefined ? title : existingTask.title,
    description: description !== undefined ? description : existingTask.description,
    priority: priority !== undefined ? (priority as TaskPriority) : existingTask.priority,
    dueDate: dueDate !== undefined ? dueDate : existingTask.dueDate,
    status: status !== undefined ? (status as TaskStatus) : existingTask.status,
    updatedAt: new Date().toISOString(),
  };

  db.tasks[taskIndex] = updatedTask;
  writeDB(db);

  res.json(updatedTask);
});

// Delete Task
app.delete("/api/tasks/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;

  const db = readDB();
  const initialLength = db.tasks.length;
  db.tasks = db.tasks.filter((t) => !(t.id === id && t.userId === req.userId));

  if (db.tasks.length === initialLength) {
    return res.status(404).json({ error: "Task not found or access denied" });
  }

  writeDB(db);
  res.json({ success: true, message: "Task successfully deleted" });
});

// Get Dashboard Statistics
app.get("/api/dashboard/stats", authenticateToken, (req: any, res) => {
  const db = readDB();
  const userTasks = db.tasks.filter((t) => t.userId === req.userId);

  const total = userTasks.length;
  const completed = userTasks.filter((t) => t.status === "Completed").length;
  const pending = userTasks.filter((t) => t.status === "Pending").length;
  const inProgress = userTasks.filter((t) => t.status === "In Progress").length;

  const byPriority = {
    Low: userTasks.filter((t) => t.priority === "Low").length,
    Medium: userTasks.filter((t) => t.priority === "Medium").length,
    High: userTasks.filter((t) => t.priority === "High").length,
  };

  res.json({
    total,
    completed,
    pending,
    inProgress,
    byPriority,
  });
});

// ==================== Vite Dev Server & Static Serving ====================

async function startServer() {
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
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
