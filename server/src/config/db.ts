import mongoose from 'mongoose';

async function main(){
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }
    await mongoose.connect(uri);
}

export default main;