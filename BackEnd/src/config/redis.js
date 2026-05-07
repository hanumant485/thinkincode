const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_URL,
    socket: {
        host: 'redis-16378.crce300.ap-south-1-2.ec2.cloud.redislabs.com',
        port: 16378
    }
});

module.exports = redisClient;