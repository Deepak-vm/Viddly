const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

exports.downloadFromYoutube = async (url) => {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = path.join(__dirname, '../downloads', `${title}.mp4`);
    await new Promise((resolve, reject) => {
        ytdl(url, { quality: 'highestvideo' })
            .pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject);
    });
    return filePath;
};
