const fileEl = $("#fileInput");
const uploadEl = $("#uploadBtn");
const chunkSize = 1 * 1024 * 1024; // 1M
const maxSize = 20 * 1024 * 1024; // 20M

let file = null;
let fileChunks = [];

fileEl.change((e) => {
    if (!e.target.files?.length) {
        alert("no file");
        return;
    }

    file = e.target.files[0];
    fileChunks = getFileChunk(file, maxSize, chunkSize);
});

uploadEl.click((e) => {
    e.preventDefault();

    const fcLength = fileChunks.length;
    const filename = file.name;
    fileChunks.forEach((chunk, idx) => {
        let data = new FormData();
        data.append('chunk', chunk);
        data.append('idx', idx);
        data.append('total', fcLength);
        data.append('filename', filename);
        axios({
            url: 'api/upload',
            method: 'post',
            headers: {
                'Content-Type': 'multipart/form-data' 
            },
            data,
        }).then(resp => {
            console.log(resp);
        })
    });
});

function getFileChunk(file, maxSize, chunkSize) {
    const fileSize = file.size;
    if (fileSize > maxSize) {
        alert("too big file");
        return [];
    }

    const fileChunks = [];
    const chunkCount = Math.ceil(fileSize / chunkSize);

    for (let i = 0; i < chunkCount; i++) {
        let chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
        fileChunks[i] = chunk;
    }

    return fileChunks;
}
