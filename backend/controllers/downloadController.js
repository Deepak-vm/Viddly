const { downloadFromYoutube } = require('../services/youtubeDownloader');

exports.downloadVideo = async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
        const filePath = await downloadFromYoutube(url);
        res.download(filePath);
    } catch (err) {
        next(err);
    }
};
