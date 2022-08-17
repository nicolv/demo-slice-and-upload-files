# 文件切片上传（笔记）

## 设计代码时，我们需要考虑的问题
1. 乱序问题
  
    上传切片的request是异步的，切片到达server的顺序可能和上传顺序不一致，如何保证最后切片是按照原来的顺序进行组装的。
   
2. 丢包问题
   
   考虑当前方案是否可以支持断点续传。

---

## 实现步骤

### client端

1. 页面上放简单两个控件
  
   input type=file

   button
   
2. 监听input的onchange事件，获取文件流，对流进行切片后，找个地方存着（e.g.挂到window上）
  
    `chunk = e.target.file[0]` 
    
    `chunks = chunk.slice(from, to)`

3. 监听button的onclick事件，把切好片的流分别上传

    request Content-Type: multipart/form-data
    
    request payload: 

    ```json
    {
       chunk: 上述切好片的chunk,
       idx: chunk的顺序, // 用来拼接
       total: chunks的总片数,
       filename: 文件名,
    }
    ```

### server端

1. 获取上传的chunks、chunk顺序、总片数、文件名
   
   用multiparty来接request

   ```js
    const form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        // 注意：multiparty的fields返回的都是数组
        const {
            idx: [idx],
            total: [total],
            filename: [filename],
        } = fields;
        const chunk = files.chunk[0]; // 主要用它的path属性
        ...
    })
   ```

2. 创建tmp文件夹用来储存渐渐到来的chunks
   
    `const stream = fs.createWriteStream(filepath)`

    `fs.readFileSync(chunk.path)`

..

    tmp ----
         丨---- filename.fileextention // filename
                    丨---- 0           // idx
                    ｜---- 1           // idx

    

1. 监听上述stream的close，判断 filename.fileextention 的文件个数是否等于 total
   
2. 如果相等，说明已经全部上传完毕
    
    按chunk的文件名顺序拼接成完整文件，存到upload文件夹下
  
    `const stream = fs.createWriteStream(distFilePath)`
    
    `chunkFileStream = fs.readFileSync(chunkPath)`
    
    `stream.write(chunkFileStream, stream.length)` 追加模式
    
    `stream.close()`
  
    删除tmp下的零时chunks文件

---
## 断点续传

### 方案一

    在client切片的时候，计算每个片的hash，在上传chunks之前，先上传他们的hash（CryptoJS.MD5）

    在server端，计算之前上传的切片的hash（当然可以在第一次计算后保存一下，不用每次计算）
    
    server返回计算正确的hash
    
    client从所有hash中剔除正确的hash，剩下的hash对应的切片就是需要上传的切片

    优点：可以保证传输到server的切片内容是经过校验的

    缺点：生成hash的事件过长，失去切片上传的意义

    改进：不要对内容进行hash，可以对文件的属性（文件名+创建时间+修改时间）进行hash

### 方案二

    简单用切片的文件名来做校验，因为切片的文件名就是切片的顺序，其他步骤和方案一一样