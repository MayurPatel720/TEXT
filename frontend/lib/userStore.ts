// Simple in-memory user store (replace with database in production)
export const users: any[] = [];

console.log("✅ User store initialized");

export function addUser(user: any) {
  users.push(user);
  console.log("📝 User added to store. Total users:", users.length);
  console.log("📋 All users:", users.map(u => ({ id: u.id, email: u.email, name: u.name })));
}

export function getUserByEmail(email: string) {
  console.log("🔍 Looking for user with email:", email);
  console.log("📋 Current users in store:", users.map(u => ({ id: u.id, email: u.email })));
  const user = users.find(u => u.email === email);
  return user;
}
