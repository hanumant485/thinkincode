const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_URL,
    socket: {
        host: 'redis-14099.crce300.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 14099
    }
});

module.exports = redisClient;