const multiparty = require("multiparty");
const path = require("path");
const fs = require("fs");

const tmpFolder = path.resolve(__dirname, "../tmp");
const uploadFolder = path.resolve(__dirname, "../upload");

class UploadController {
    instance = null;

    static getInstance() {
        if (!this.instance) {
            this.instance = new UploadController();
        }

        return this.instance;
    }

    upload(req, res) {
        const form = new multiparty.Form();

        form.parse(req, function (err, fields, files) {
            const {
                idx: [idx],
                total: [total],
                filename: [filename],
            } = fields;

            // 创建tmp文件夹，用文件的形式存储传过来的chunks
            const tmpChunkFolder = path.resolve(tmpFolder, filename);
            !fs.existsSync(tmpFolder) && fs.mkdir(tmpFolder);
            !fs.existsSync(tmpChunkFolder) && fs.mkdirSync(tmpChunkFolder);

            const tmpChunkPath = path.resolve(tmpChunkFolder, idx);
            const chunk = files.chunk[0];
            const stream = fs.createWriteStream(tmpChunkPath);
            stream.end(fs.readFileSync(chunk.path));

            stream.close(() => {
                // 当chunks全部传输完成后，组装tmp下的chunks为完整文件
                const chunkLen = fs.readdirSync(tmpChunkFolder).length;
                if (chunkLen.toString() === total) {
                    !fs.existsSync(uploadFolder) && fs.mkdirSync(uploadFolder);

                    // 如果存在目标文件，就删除再创建
                    const distFilePath = path.resolve(uploadFolder, filename);
                    fs.existsSync(distFilePath) && fs.rmSync(distFilePath);
                    const distFileStream = fs.createWriteStream(distFilePath);
                    for (let i = 0; i < chunkLen; i++) {
                        const orgChunkPath = path.resolve(tmpChunkFolder, "" + i);
                        const orgChunkStream = fs.readFileSync(orgChunkPath);

                        // 把读取出的chunk放到最终文件的文末
                        distFileStream.write(orgChunkStream, distFileStream.length);
                    }
                    distFileStream.close();

                    // 删除tmp文件夹下的chunks
                    fs.rmdirSync(tmpChunkFolder, {recursive: true, force: true});
                }

                // 返回结果
                res.send({message: "ok", status: 200});
            });
        });
    }
}

module.exports = UploadController;
