require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Message = require('../models/Message');
const connectDB = require('./db');

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Alice',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Bob',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Diana',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Eve',
];

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  await User.deleteMany({});
  await Message.deleteMany({});

  const hash = (p) => bcrypt.hash(p, 12);

  const users = await User.insertMany([
    {
      username: 'alice',
      email: 'alice@demo.com',
      password: await hash('demo1234'),
      bio: 'Hey there! I\'m using ChatApp 👋',
      profilePic: AVATARS[0],
    },
    {
      username: 'bob',
      email: 'bob@demo.com',
      password: await hash('demo1234'),
      bio: 'Software engineer 💻',
      profilePic: AVATARS[1],
    },
    {
      username: 'charlie',
      email: 'charlie@demo.com',
      password: await hash('demo1234'),
      bio: 'Photography enthusiast 📸',
      profilePic: AVATARS[2],
    },
    {
      username: 'diana',
      email: 'diana@demo.com',
      password: await hash('demo1234'),
      bio: 'Design & coffee ☕',
      profilePic: AVATARS[3],
    },
    {
      username: 'eve',
      email: 'eve@demo.com',
      password: await hash('demo1234'),
      bio: 'Traveler 🌍',
      profilePic: AVATARS[4],
    },
  ]);

  // Make everyone friends with alice
  const alice = users[0];
  const others = users.slice(1);

  for (const u of others) {
    await User.findByIdAndUpdate(alice._id, { $addToSet: { friends: u._id } });
    await User.findByIdAndUpdate(u._id, { $addToSet: { friends: alice._id } });
  }

  // Add bob and charlie as friends too
  await User.findByIdAndUpdate(users[1]._id, { $addToSet: { friends: users[2]._id } });
  await User.findByIdAndUpdate(users[2]._id, { $addToSet: { friends: users[1]._id } });

  // Seed some messages between alice and bob
  const msgs = [
    { text: 'Hey Bob! How are you doing?', from: alice._id, to: users[1]._id },
    { text: 'Alice! Great to hear from you 😊', from: users[1]._id, to: alice._id },
    { text: 'Are you coming to the meetup this Friday?', from: alice._id, to: users[1]._id },
    { text: "Yes! I'll be there. Can't wait 🎉", from: users[1]._id, to: alice._id },
    { text: 'Awesome! See you there 👋', from: alice._id, to: users[1]._id },
  ];

  for (const m of msgs) {
    await Message.create({ senderId: m.from, receiverId: m.to, text: m.text, status: 'seen' });
  }

  console.log('\n📋 SEED COMPLETE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach(u => console.log(`  ${u.username.padEnd(10)} ${u.email.padEnd(22)} / demo1234`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
